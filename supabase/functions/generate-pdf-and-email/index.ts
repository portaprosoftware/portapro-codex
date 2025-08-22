import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestData {
  type: 'quote' | 'invoice';
  id: string;
  action: 'generate_pdf' | 'send_email' | 'both';
  recipient_email?: string;
  recipient_name?: string;
  subject?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: RequestData = await req.json();
    
    console.log('Processing request:', {
      type: requestData.type,
      id: requestData.id,
      action: requestData.action,
      recipient_email: requestData.recipient_email,
      recipient_name: requestData.recipient_name,
      subject: requestData.subject,
      message: requestData.message
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch document data
    let documentData: any;
    let items: any[];

    if (requestData.type === 'quote') {
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          customers:customer_id (
            name,
            email,
            phone,
            service_street,
            service_city,
            service_state,
            service_zip
          )
        `)
        .eq('id', requestData.id)
        .single();

      if (quoteError) throw quoteError;
      documentData = quote;

      const { data: quoteItems, error: itemsError } = await supabase
        .from('quote_items')
        .select(`
          *,
          products!inner(id, name)
        `)
        .eq('quote_id', requestData.id);

      if (itemsError) throw itemsError;
      items = quoteItems;
    } else {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          customers:customer_id (
            name,
            email,
            phone,
            service_street,
            service_city,
            service_state,
            service_zip
          )
        `)
        .eq('id', requestData.id)
        .single();

      if (invoiceError) throw invoiceError;
      documentData = invoice;

      const { data: invoiceItems, error: itemsError } = await supabase
        .from('invoice_items')
        .select(`
          *,
          products!inner(id, name)
        `)
        .eq('invoice_id', requestData.id);

      if (itemsError) throw itemsError;
      items = invoiceItems;
    }

    // Fetch additional data
    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    // Fetch products for name lookup
    const { data: products } = await supabase
      .from('products')
      .select('id, name');

    console.log(`Fetched ${items?.length || 0} items for ${requestData.type}:`, items);

    // Validate we have items with proper pricing
    if (!items || items.length === 0) {
      throw new Error(`No items found for ${requestData.type} ${requestData.id}`);
    }

    const hasValidPricing = items.some(item => 
      (item.unit_price && Number(item.unit_price) > 0) || 
      (item.line_total && Number(item.line_total) > 0)
    );

    if (!hasValidPricing) {
      console.warn(`Warning: ${requestData.type} has items with zero pricing`, items);
    }

    // Generate HTML
    const pdfHtml = await generatePDFHTML(documentData, items, companySettings, products || [], requestData.type);

    // Send email if requested
    if (requestData.action === 'send_email' || requestData.action === 'both') {
      if (!requestData.recipient_email) {
        throw new Error('Recipient email is required for email action');
      }

      try {
        const emailResponse = await resend.emails.send({
          from: "PortaPro <onboarding@resend.dev>", // Use verified domain
          to: [requestData.recipient_email],
          subject: requestData.subject || `${requestData.type.charAt(0).toUpperCase() + requestData.type.slice(1)} from PortaPro`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Hello ${requestData.recipient_name || 'Valued Customer'},</h2>
              <p>${requestData.message || `Please find your ${requestData.type} attached.`}</p>
              <div style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                ${pdfHtml}
              </div>
              <p>Thank you for your business!</p>
              <p>Best regards,<br>PortaPro Team</p>
            </div>
          `,
        });

        console.log("Email sent successfully:", emailResponse);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        throw new Error(`Email sending failed: ${emailError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${requestData.type} ${requestData.action} completed successfully`,
        pdf_available: requestData.action === 'generate_pdf' || requestData.action === 'both',
        html: pdfHtml // Return the HTML content for download
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-pdf-and-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
};

async function generatePDFHTML(documentData: any, items: any[], companySettings: any, products: any[], type: string): Promise<string> {
  
  const getProductName = (item: any) => {
    // First priority: properly formatted product name from the item
    if (item.product_name && item.product_name !== 'Product' && !item.product_name.includes('-') && item.product_name.length > 5) {
      return item.product_name;
    }
    
    // Second priority: joined products data from the query
    if (item.products && item.products.name) {
      return item.products.name;
    }
    
    // Third priority: lookup in products array
    const product = products?.find(p => p.id === item.product_id);
    if (product?.name) {
      return product.name;
    }
    
    // Fallback
    return item.product_name || 'Unknown Product';
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      'pending': 'background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;',
      'sent': 'background: #dbeafe; color: #1e40af; border: 1px solid #3b82f6;',
      'accepted': 'background: #dcfce7; color: #166534; border: 1px solid #22c55e;',
      'rejected': 'background: #fecaca; color: #991b1b; border: 1px solid #ef4444;',
      'paid': 'background: #dcfce7; color: #166534; border: 1px solid #22c55e;',
      'unpaid': 'background: #fef3c7; color: #92400e; border: 1px solid #f59e0b;',
      'overdue': 'background: #fecaca; color: #991b1b; border: 1px solid #ef4444;'
    };
    
    const style = statusStyles[status.toLowerCase()] || statusStyles['pending'];
    return `<span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; text-transform: uppercase; ${style}">${status.replace('_', ' ')}</span>`;
  };

  const documentTitle = type === 'quote' ? 'Quote' : 'Invoice';
  const documentNumber = type === 'quote' ? documentData.quote_number : documentData.invoice_number;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${documentTitle} ${documentNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      margin: 0; 
      padding: 0; 
      background: #ffffff;
      color: #1f2937;
      line-height: 1.5;
    }
    
    .document-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      background: white;
    }
    
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid;
      border-image: linear-gradient(135deg, hsl(214, 83%, 56%), hsl(195, 84%, 65%)) 1;
    }
    
    .company-info {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    
    .company-details h1 {
      margin: 0 0 5px 0;
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, hsl(214, 83%, 56%), hsl(195, 84%, 65%));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .company-details p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
    
    .document-info {
      text-align: right;
    }
    
    .document-info h2 {
      margin: 0 0 10px 0;
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .document-number {
      display: inline-block;
      background: linear-gradient(135deg, hsl(214, 83%, 56%), hsl(195, 84%, 65%));
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    
    .status-badge {
      display: inline-block;
      margin-bottom: 10px;
    }
    
    .document-details {
      font-size: 14px;
      color: #6b7280;
    }
    
    .customer-section {
      margin: 40px 0;
      padding: 24px;
      background: #f9fafb;
      border-radius: 12px;
      border-left: 4px solid hsl(214, 83%, 56%);
    }
    
    .customer-section h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .customer-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .customer-info p {
      margin: 4px 0;
      color: #374151;
    }
    
    .customer-info strong {
      color: #1f2937;
    }
    
    .items-section {
      margin: 40px 0;
    }
    
    .items-section h3 {
      margin: 0 0 20px 0;
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .items-table th {
      background: linear-gradient(135deg, hsl(214, 83%, 56%), hsl(195, 84%, 65%));
      color: white;
      padding: 16px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
    }
    
    .items-table td {
      padding: 16px 12px;
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
    }
    
    .items-table tbody tr:hover {
      background-color: #f9fafb;
    }
    
    .items-table tbody tr:last-child td {
      border-bottom: none;
    }
    
    .totals-section {
      margin: 40px 0;
      padding: 24px;
      background: #f9fafb;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }
    
    .totals-grid {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      max-width: 400px;
      margin-left: auto;
    }
    
    .totals-grid .label {
      font-weight: 500;
      color: #374151;
    }
    
    .totals-grid .value {
      text-align: right;
      font-weight: 600;
      color: #1f2937;
    }
    
    .total-amount {
      font-size: 18px;
      padding-top: 12px;
      border-top: 2px solid #d1d5db;
      margin-top: 12px;
      background: linear-gradient(135deg, hsl(214, 83%, 56%), hsl(195, 84%, 65%));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .footer-section {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    
    .terms-section {
      margin: 40px 0;
      padding: 20px;
      background: #fffbeb;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
    }
    
    .terms-section h4 {
      margin: 0 0 12px 0;
      color: #92400e;
      font-weight: 600;
    }
    
    .terms-section p {
      margin: 0;
      color: #78350f;
      font-size: 14px;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .document-container {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="document-container">
    <!-- Header Section -->
    <div class="header-section">
      <div class="company-info">
        <div class="company-details">
          <h1>${companySettings?.company_name || 'PortaPro'}</h1>
          <p>Portable Toilet Rental Services</p>
          ${companySettings?.company_phone ? `<p>Phone: ${companySettings.company_phone}</p>` : ''}
          ${companySettings?.company_email ? `<p>Email: ${companySettings.company_email}</p>` : ''}
        </div>
      </div>
      
      <div class="document-info">
        <h2>${documentTitle}</h2>
        <div class="document-number">${documentNumber}</div>
        <div class="status-badge">${getStatusBadge(documentData.status)}</div>
        <div class="document-details">
          <p><strong>Date:</strong> ${new Date(documentData.created_at).toLocaleDateString()}</p>
          ${type === 'quote' && documentData.expiration_date ? `<p><strong>Expires:</strong> ${new Date(documentData.expiration_date).toLocaleDateString()}</p>` : ''}
          ${type === 'invoice' && documentData.due_date ? `<p><strong>Due:</strong> ${new Date(documentData.due_date).toLocaleDateString()}</p>` : ''}
        </div>
      </div>
    </div>

    <!-- Customer Section -->
    <div class="customer-section">
      <h3>Bill To</h3>
      <div class="customer-details">
        <div class="customer-info">
          <p><strong>Customer:</strong> ${documentData.customers?.name || 'N/A'}</p>
          ${documentData.customers?.email ? `<p><strong>Email:</strong> ${documentData.customers.email}</p>` : ''}
          ${documentData.customers?.phone ? `<p><strong>Phone:</strong> ${documentData.customers.phone}</p>` : ''}
        </div>
        <div class="customer-info">
          ${documentData.customers?.service_street ? `
            <p><strong>Service Address:</strong></p>
            <p>${documentData.customers.service_street}</p>
            <p>${documentData.customers.service_city}, ${documentData.customers.service_state} ${documentData.customers.service_zip}</p>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- Items Section -->
    <div class="items-section">
      <h3>${type === 'quote' ? 'Quote' : 'Invoice'} Items</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>Item Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            ${type === 'quote' ? '<th>Rental Days</th>' : ''}
            <th>Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>
                <strong>${getProductName(item)}</strong>
                ${item.description ? `<br><small style="color: #6b7280;">${item.description}</small>` : ''}
              </td>
              <td>${item.quantity || 0}</td>
              <td>$${Number(item.unit_price || 0).toFixed(2)}</td>
              ${type === 'quote' ? `<td>${item.rental_duration_days || 1} days</td>` : ''}
              <td><strong>$${Number(item.line_total || 0).toFixed(2)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Totals Section -->
    <div class="totals-section">
      <div class="totals-grid">
        <span class="label">Subtotal:</span>
        <span class="value">$${Number(documentData.subtotal || 0).toFixed(2)}</span>
        
        ${documentData.discount_value && Number(documentData.discount_value) > 0 ? `
          <span class="label">Discount:</span>
          <span class="value">-$${Number(documentData.discount_value || 0).toFixed(2)}</span>
        ` : ''}
        
        ${documentData.additional_fees && Number(documentData.additional_fees) > 0 ? `
          <span class="label">Additional Fees:</span>
          <span class="value">$${Number(documentData.additional_fees || 0).toFixed(2)}</span>
        ` : ''}
        
        <span class="label">Tax:</span>
        <span class="value">$${Number(documentData.tax_amount || 0).toFixed(2)}</span>
        
        <span class="label total-amount">Total Amount:</span>
        <span class="value total-amount">$${Number(documentData.total_amount || 0).toFixed(2)}</span>
      </div>
    </div>

    ${documentData.terms ? `
      <div class="terms-section">
        <h4>Terms & Conditions</h4>
        <p>${documentData.terms}</p>
      </div>
    ` : ''}

    ${documentData.notes ? `
      <div style="margin: 30px 0; padding: 20px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #0ea5e9;">
        <h4 style="margin: 0 0 10px 0; color: #0c4a6e;">Notes</h4>
        <p style="margin: 0; color: #164e63;">${documentData.notes}</p>
      </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer-section">
      <p>Thank you for choosing ${companySettings?.company_name || 'PortaPro'}!</p>
      <p>This document was generated on ${new Date().toLocaleDateString()}</p>
    </div>
  </div>
</body>
</html>`;
}

serve(handler);
