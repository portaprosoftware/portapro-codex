import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
  console.log('🎯 Quote PDF Generator - Request received');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: RequestData = await req.json();
    console.log('📝 Processing request:', requestData);

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

    console.log(`📊 Found ${items?.length || 0} items for ${requestData.type}`);

    // Generate PDF HTML
    const html = generatePDFHTML(documentData, items, requestData.type);
    console.log('✅ HTML generated successfully, length:', html.length);
    
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
      
      console.log('📧 Email sent successfully');
    }
    
    const response = { 
      html,
      success: true,
      message: `${requestData.type} PDF generated successfully`
    };
    
    console.log('🚀 Returning response with HTML length:', html.length);
    
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error("❌ Error in quote-pdf-generator:", error);
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

function generatePDFHTML(documentData: any, items: any[], type: string): string {
  const documentTitle = type === 'quote' ? 'Quote' : 'Invoice';
  const documentNumber = type === 'quote' ? documentData.quote_number : documentData.invoice_number;
  
  const getProductName = (item: any) => {
    if (item.products && item.products.name) {
      return item.products.name;
    }
    return item.product_name || 'Unknown Product';
  };

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
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${documentTitle} ${documentNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Arial', sans-serif; 
      margin: 0; 
      padding: 20px; 
      background: #ffffff;
      color: #1f2937;
      line-height: 1.6;
      font-size: 14px;
    }
    .document-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .header-section {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      padding: 40px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .company-info h1 {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .company-tagline {
      font-size: 16px;
      margin-bottom: 16px;
      opacity: 0.9;
    }
    .document-info {
      text-align: right;
      background: rgba(255, 255, 255, 0.15);
      padding: 24px;
      border-radius: 12px;
    }
    .document-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
      text-transform: uppercase;
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
    .content-section {
      padding: 40px;
    }
    .customer-section {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
    }
    .customer-info p {
      margin: 4px 0;
      color: #374151;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .items-table thead {
      background: #1f2937;
    }
    .items-table th {
      color: white;
      padding: 16px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
    }
    .items-table tbody tr {
      border-bottom: 1px solid #e5e7eb;
    }
    .items-table tbody tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .items-table td {
      padding: 16px;
      color: #374151;
    }
    .product-name {
      font-weight: 600;
      color: #1f2937;
    }
    .totals-section {
      text-align: right;
      margin-top: 24px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .total-row.final {
      font-size: 18px;
      font-weight: 700;
      border-bottom: 3px solid #3b82f6;
      color: #1f2937;
    }
    .footer-section {
      background: #f9fafb;
      padding: 24px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="document-container">
    <div class="header-section">
      <div class="header-content">
        <div class="company-info">
          <h1>PortaPro</h1>
          <div class="company-tagline">Professional Portable Toilet Solutions</div>
        </div>
        <div class="document-info">
          <div class="document-title">${documentTitle}</div>
          <div class="document-number">${documentNumber}</div>
          ${getStatusBadge(documentData.status)}
          <div style="margin-top: 16px; font-size: 13px;">
            <div>Date: ${new Date(documentData.created_at).toLocaleDateString()}</div>
            ${documentData.expiration_date ? `<div>Expires: ${new Date(documentData.expiration_date).toLocaleDateString()}</div>` : ''}
          </div>
        </div>
      </div>
    </div>

    <div class="content-section">
      <div class="customer-section">
        <div class="section-title">Customer Information</div>
        <div class="customer-info">
          <p><strong>${documentData.customers.name}</strong></p>
          ${documentData.customers.email ? `<p>Email: ${documentData.customers.email}</p>` : ''}
          ${documentData.customers.phone ? `<p>Phone: ${documentData.customers.phone}</p>` : ''}
          ${documentData.customers.service_street ? `
            <p>Address: ${documentData.customers.service_street}</p>
            <p>${documentData.customers.service_city}, ${documentData.customers.service_state} ${documentData.customers.service_zip}</p>
          ` : ''}
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>
                <div class="product-name">${getProductName(item)}</div>
                ${item.description ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${item.description}</div>` : ''}
              </td>
              <td>${item.quantity}</td>
              <td>$${Number(item.unit_price || 0).toFixed(2)}</td>
              <td>$${Number(item.line_total || 0).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-section">
        <div style="max-width: 300px; margin-left: auto;">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>$${Number(documentData.subtotal || 0).toFixed(2)}</span>
          </div>
          ${documentData.discount_value > 0 ? `
            <div class="total-row">
              <span>Discount (${documentData.discount_type === 'percentage' ? documentData.discount_value + '%' : '$' + documentData.discount_value}):</span>
              <span>-$${Number(documentData.discount_type === 'percentage' ? (documentData.subtotal * documentData.discount_value / 100) : documentData.discount_value).toFixed(2)}</span>
            </div>
          ` : ''}
          ${documentData.tax_amount > 0 ? `
            <div class="total-row">
              <span>Tax:</span>
              <span>$${Number(documentData.tax_amount || 0).toFixed(2)}</span>
            </div>
          ` : ''}
          ${documentData.additional_fees > 0 ? `
            <div class="total-row">
              <span>Additional Fees:</span>
              <span>$${Number(documentData.additional_fees || 0).toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-row final">
            <span>Total:</span>
            <span>$${Number(documentData.total_amount || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      ${documentData.notes ? `
        <div style="margin-top: 32px;">
          <div class="section-title">Notes</div>
          <p style="color: #374151; background: #f9fafb; padding: 16px; border-radius: 8px;">${documentData.notes}</p>
        </div>
      ` : ''}

      ${documentData.terms ? `
        <div style="margin-top: 24px;">
          <div class="section-title">Terms & Conditions</div>
          <p style="color: #6b7280; font-size: 12px; line-height: 1.5;">${documentData.terms}</p>
        </div>
      ` : ''}
    </div>

    <div class="footer-section">
      <p>Thank you for choosing PortaPro for your portable toilet needs!</p>
      <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>
  </div>
</body>
</html>`;
}

serve(handler);