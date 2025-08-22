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

    // Generate PDF HTML
    const html = await generatePDFHTML(documentData, items, companySettings, products || [], requestData.type);
    
    // Send email if requested
    if (requestData.action === 'send_email' || requestData.action === 'both') {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      
      const emailResult = await resend.emails.send({
        from: 'PortaPro <onboarding@resend.dev>',
        to: [requestData.recipient_email],
        subject: requestData.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${requestData.recipient_name},</h2>
            <p>${requestData.message.replace(/\n/g, '<br>')}</p>
            <div style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h3>${requestData.type === 'quote' ? 'Quote' : 'Invoice'} Details:</h3>
              ${html}
            </div>
            <p>Thank you for your business!</p>
          </div>
        `
      });
      
      console.log('Email sent successfully:', emailResult);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        html,
        message: `${requestData.type} processed successfully`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      margin: 0; 
      padding: 0; 
      background: #ffffff;
      color: #1f2937;
      line-height: 1.6;
      font-size: 14px;
    }
    
    .document-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 0;
      background: white;
      min-height: 100vh;
    }
    
    .header-section {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      padding: 40px;
      position: relative;
      overflow: hidden;
    }
    
    .header-section::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 200px;
      height: 200px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      transform: translate(50px, -50px);
    }
    
    .header-section::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 150px;
      height: 150px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 50%;
      transform: translate(-50px, 50px);
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
      z-index: 2;
    }
    
    .company-info h1 {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .company-tagline {
      font-size: 16px;
      font-weight: 400;
      opacity: 0.9;
      margin-bottom: 16px;
    }
    
    .company-contact {
      font-size: 14px;
      opacity: 0.8;
      line-height: 1.5;
    }
    
    .document-info {
      text-align: right;
      background: rgba(255, 255, 255, 0.15);
      padding: 24px;
      border-radius: 16px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .document-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .document-number {
      font-size: 20px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      display: inline-block;
    }
    
    .status-badge {
      display: inline-block;
      margin-bottom: 16px;
    }
    
    .document-meta {
      font-size: 13px;
      opacity: 0.9;
      line-height: 1.6;
    }
    
    .content-section {
      padding: 40px;
    }
    
    .customer-section {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 40px;
      position: relative;
    }
    
    .customer-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(to bottom, #3b82f6, #1d4ed8);
      border-radius: 2px;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
    }
    
    .section-title::before {
      content: '';
      width: 8px;
      height: 8px;
      background: #3b82f6;
      border-radius: 50%;
      margin-right: 12px;
    }
    
    .customer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }
    
    .customer-info h4 {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .customer-info p {
      margin: 6px 0;
      color: #6b7280;
      font-weight: 500;
    }
    
    .customer-info .highlight {
      color: #1f2937;
      font-weight: 600;
    }
    
    .items-section {
      margin: 40px 0;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .items-table thead {
      background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
    }
    
    .items-table th {
      color: white;
      padding: 20px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .items-table tbody tr {
      border-bottom: 1px solid #e5e7eb;
      transition: background-color 0.2s ease;
    }
    
    .items-table tbody tr:nth-child(even) {
      background-color: #f9fafb;
    }
    
    .items-table tbody tr:hover {
      background-color: #f3f4f6;
    }
    
    .items-table td {
      padding: 20px 16px;
      color: #374151;
      font-weight: 500;
      vertical-align: top;
    }
    
    .product-name {
      font-weight: 600;
      color: #1f2937;
      font-size: 15px;
    }
    
    .product-description {
      font-size: 13px;
      color: #6b7280;
      margin-top: 4px;
      font-style: italic;
    }
    
    .price-cell {
      font-weight: 600;
      color: #059669;
      font-size: 15px;
    }
    
    .totals-section {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      padding: 32px;
      margin: 40px 0;
    }
    
    .totals-grid {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      max-width: 400px;
      margin-left: auto;
    }
    
    .totals-row {
      display: contents;
    }
    
    .totals-label {
      font-weight: 500;
      color: #374151;
      padding: 8px 0;
    }
    
    .totals-value {
      text-align: right;
      font-weight: 600;
      color: #1f2937;
      padding: 8px 0;
    }
    
    .total-final {
      border-top: 3px solid #3b82f6;
      margin-top: 16px;
      padding-top: 16px;
      font-size: 20px;
      font-weight: 700;
    }
    
    .total-final .totals-label {
      color: #1f2937;
      font-size: 18px;
    }
    
    .total-final .totals-value {
      color: #059669;
      font-size: 24px;
    }
    
    .terms-section, .notes-section {
      background: #fffbeb;
      border: 2px solid #fbbf24;
      border-radius: 12px;
      padding: 24px;
      margin: 32px 0;
      position: relative;
    }
    
    .terms-section::before, .notes-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: #fbbf24;
      border-radius: 2px;
    }
    
    .terms-section h4, .notes-section h4 {
      color: #92400e;
      font-weight: 700;
      margin-bottom: 12px;
      font-size: 16px;
    }
    
    .terms-section p, .notes-section p {
      color: #78350f;
      line-height: 1.7;
      font-weight: 500;
    }
    
    .footer-section {
      background: #1f2937;
      color: white;
      padding: 32px 40px;
      text-align: center;
      margin-top: 60px;
    }
    
    .footer-content {
      max-width: 600px;
      margin: 0 auto;
    }
    
    .footer-section h3 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    
    .footer-section p {
      color: #d1d5db;
      margin: 8px 0;
      font-weight: 500;
    }
    
    .footer-divider {
      width: 100px;
      height: 2px;
      background: #3b82f6;
      margin: 20px auto;
      border-radius: 1px;
    }
    
    @media print {
      body { margin: 0; padding: 0; }
      .document-container { padding: 0; }
      .header-section { break-inside: avoid; }
      .customer-section { break-inside: avoid; }
      .totals-section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="document-container">
    <!-- Professional Header -->
    <div class="header-section">
      <div class="header-content">
        <div class="company-info">
          <h1>${companySettings?.company_name || 'PortaPro'}</h1>
          <div class="company-tagline">Professional Portable Sanitation Services</div>
          <div class="company-contact">
            ${companySettings?.company_phone ? `<div>📞 ${companySettings.company_phone}</div>` : ''}
            ${companySettings?.company_email ? `<div>✉️ ${companySettings.company_email}</div>` : ''}
            ${companySettings?.company_street ? `<div>📍 ${companySettings.company_street}, ${companySettings.company_city || ''} ${companySettings.company_state || ''}</div>` : ''}
          </div>
        </div>
        
        <div class="document-info">
          <div class="document-title">${documentTitle}</div>
          <div class="document-number">${documentNumber}</div>
          <div class="status-badge">${getStatusBadge(documentData.status)}</div>
          <div class="document-meta">
            <div><strong>Issue Date:</strong> ${new Date(documentData.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
            ${type === 'quote' && documentData.expiration_date ? `<div><strong>Valid Until:</strong> ${new Date(documentData.expiration_date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>` : ''}
            ${type === 'invoice' && documentData.due_date ? `<div><strong>Payment Due:</strong> ${new Date(documentData.due_date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>` : ''}
          </div>
        </div>
      </div>
    </div>

    <div class="content-section">
      <!-- Customer Information -->
      <div class="customer-section">
        <h3 class="section-title">Customer Information</h3>
        <div class="customer-grid">
          <div class="customer-info">
            <h4>Bill To</h4>
            <p class="highlight">${documentData.customers?.name || 'N/A'}</p>
            ${documentData.customers?.email ? `<p>📧 ${documentData.customers.email}</p>` : ''}
            ${documentData.customers?.phone ? `<p>📞 ${documentData.customers.phone}</p>` : ''}
          </div>
          <div class="customer-info">
            ${documentData.customers?.service_street ? `
              <h4>Service Address</h4>
              <p>${documentData.customers.service_street}</p>
              <p>${documentData.customers.service_city}, ${documentData.customers.service_state} ${documentData.customers.service_zip}</p>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Items Section -->
      <div class="items-section">
        <h3 class="section-title">${type === 'quote' ? 'Quoted Items & Services' : 'Invoiced Items & Services'}</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40%;">Description</th>
              <th style="width: 12%; text-align: center;">Qty</th>
              <th style="width: 15%; text-align: right;">Unit Price</th>
              ${type === 'quote' ? '<th style="width: 13%; text-align: center;">Duration</th>' : ''}
              <th style="width: 20%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>
                  <div class="product-name">${getProductName(item)}</div>
                  ${item.description ? `<div class="product-description">${item.description}</div>` : ''}
                </td>
                <td style="text-align: center; font-weight: 600;">${item.quantity || 0}</td>
                <td class="price-cell" style="text-align: right;">$${Number(item.unit_price || 0).toFixed(2)}</td>
                ${type === 'quote' ? `<td style="text-align: center; font-weight: 600;">${item.rental_duration_days || 1} ${(item.rental_duration_days || 1) === 1 ? 'day' : 'days'}</td>` : ''}
                <td class="price-cell" style="text-align: right;">$${Number(item.line_total || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals Section -->
      <div class="totals-section">
        <div class="totals-grid">
          <div class="totals-row">
            <span class="totals-label">Subtotal:</span>
            <span class="totals-value">$${Number(documentData.subtotal || 0).toFixed(2)}</span>
          </div>
          
          ${documentData.discount_value && Number(documentData.discount_value) > 0 ? `
            <div class="totals-row">
              <span class="totals-label">Discount Applied:</span>
              <span class="totals-value" style="color: #dc2626;">-$${Number(documentData.discount_value || 0).toFixed(2)}</span>
            </div>
          ` : ''}
          
          ${documentData.additional_fees && Number(documentData.additional_fees) > 0 ? `
            <div class="totals-row">
              <span class="totals-label">Additional Fees:</span>
              <span class="totals-value">$${Number(documentData.additional_fees || 0).toFixed(2)}</span>
            </div>
          ` : ''}
          
          <div class="totals-row">
            <span class="totals-label">Tax:</span>
            <span class="totals-value">$${Number(documentData.tax_amount || 0).toFixed(2)}</span>
          </div>
          
          <div class="totals-row total-final">
            <span class="totals-label">Total Amount:</span>
            <span class="totals-value">$${Number(documentData.total_amount || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      ${documentData.terms ? `
        <div class="terms-section">
          <h4>📋 Terms & Conditions</h4>
          <p>${documentData.terms}</p>
        </div>
      ` : ''}

      ${documentData.notes ? `
        <div class="notes-section">
          <h4>📝 Additional Notes</h4>
          <p>${documentData.notes}</p>
        </div>
      ` : ''}
    </div>

    <!-- Professional Footer -->
    <div class="footer-section">
      <div class="footer-content">
        <h3>Thank You for Your Business!</h3>
        <div class="footer-divider"></div>
        <p>This ${documentTitle.toLowerCase()} was professionally generated by ${companySettings?.company_name || 'PortaPro'}</p>
        <p>Generated on ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        ${type === 'quote' ? '<p><strong>We look forward to serving your portable sanitation needs!</strong></p>' : '<p><strong>Thank you for choosing our professional services!</strong></p>'}
      </div>
    </div>
  </div>
</body>
</html>`;
}

serve(handler);