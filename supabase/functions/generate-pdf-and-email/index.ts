import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const requestData: EmailRequest = await req.json();

    console.log('Processing request:', requestData);

    // Fetch the document data
    let documentData;
    let items = [];
    
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
        .select('*')
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
        .select('*')
        .eq('invoice_id', requestData.id);

      if (itemsError) throw itemsError;
      items = invoiceItems;
    }

    // Generate PDF HTML content
    const pdfHtml = await generatePdfHtml(documentData, items, requestData.type, supabase);

    let pdfBuffer;
    if (requestData.action === 'generate_pdf' || requestData.action === 'both') {
      // For now, we'll return the HTML. In a production environment, 
      // you'd use a service like Puppeteer or similar to generate actual PDF
      pdfBuffer = new TextEncoder().encode(pdfHtml);
    }

    // Send email if requested
    if (requestData.action === 'send_email' || requestData.action === 'both') {
      const emailSubject = requestData.subject || 
        `${requestData.type === 'quote' ? 'Quote' : 'Invoice'} from ${documentData.customers?.name || 'Your Company'}`;
      
      const emailMessage = requestData.message || 
        `Please find attached your ${requestData.type === 'quote' ? 'quote' : 'invoice'}.`;

      const emailData = {
        from: "PortaPro <noreply@resend.dev>",
        to: [requestData.recipient_email || documentData.customers?.email],
        subject: emailSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${requestData.recipient_name || documentData.customers?.name},</h2>
            <p>${emailMessage}</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${pdfHtml}
            </div>
            <p>Thank you for your business!</p>
            <p>Best regards,<br>PortaPro Team</p>
          </div>
        `,
      };

      const emailResponse = await resend.emails.send(emailData);
      console.log('Email sent successfully:', emailResponse);
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function generatePdfHtml(document: any, items: any[], type: 'quote' | 'invoice', supabase: any): Promise<string> {
  const isQuote = type === 'quote';
  const documentNumber = isQuote ? document.quote_number : document.invoice_number;
  const documentTitle = isQuote ? 'QUOTE' : 'INVOICE';
  
  // Fetch company settings for branding
  const { data: companySettings } = await supabase
    .from('company_settings')
    .select('company_name, company_logo, company_email, company_phone, company_address')
    .single();

  // Get product names for items that might have raw IDs
  const productIds = items.map(item => item.product_id).filter(Boolean);
  let products = [];
  if (productIds.length > 0) {
    const { data: productData } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds);
    products = productData || [];
  }

  // Helper function to get product name
  const getProductName = (item: any) => {
    // If we have a proper product name that's not a UUID, use it
    if (item.product_name && item.product_name !== 'Product' && !item.product_name.includes('-') && item.product_name.length > 10) {
      return item.product_name;
    }
    // Otherwise, look up the product name from our products array
    const product = products.find(p => p.id === item.product_id);
    return product?.name || item.product_name || 'Unknown Product';
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
      gap: 16px;
    }
    
    .company-logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
    }
    
    .company-details h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
    }
    
    .company-details p {
      margin: 4px 0;
      font-size: 14px;
      color: #6b7280;
    }
    
    .document-banner {
      text-align: right;
    }
    
    .document-title {
      background: linear-gradient(135deg, hsl(214, 83%, 56%), hsl(195, 84%, 65%));
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
      display: inline-block;
    }
    
    .document-info {
      display: flex;
      justify-content: space-between;
      gap: 40px;
      margin-bottom: 40px;
    }
    
    .info-card {
      flex: 1;
      background: #f9fafb;
      padding: 24px;
      border-radius: 12px;
      border-left: 4px solid hsl(214, 83%, 56%);
    }
    
    .info-card h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .customer-name {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 6px 0;
      font-size: 14px;
      color: #4b5563;
    }
    
    .contact-icon {
      width: 16px;
      height: 16px;
      opacity: 0.7;
    }
    
    .info-bar {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px 0;
      margin-bottom: 32px;
    }
    
    .info-bar-content {
      display: flex;
      justify-content: space-around;
      text-align: center;
    }
    
    .info-item strong {
      display: block;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }
    
    .info-item span {
      font-size: 14px;
      color: #6b7280;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .items-table thead th {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      padding: 16px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .items-table tbody td {
      padding: 16px 12px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: top;
    }
    
    .items-table tbody tr:hover {
      background: #fafbfc;
    }
    
    .item-name {
      font-weight: 600;
      color: #1f2937;
      font-size: 15px;
      margin-bottom: 4px;
    }
    
    .item-description {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.4;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    
    .totals-card {
      min-width: 350px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 20px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    
    .totals-row:last-child {
      border-bottom: none;
    }
    
    .total-final {
      background: linear-gradient(135deg, hsl(214, 83%, 56%), hsl(195, 84%, 65%));
      color: white;
      font-weight: 700;
      font-size: 18px;
      padding: 16px 20px;
    }
    
    .terms-section, .notes-section {
      margin-top: 40px;
      padding: 24px;
      border-radius: 12px;
    }
    
    .terms-section {
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
    }
    
    .notes-section {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
    }
    
    .section-title {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .section-content {
      font-size: 14px;
      color: #4b5563;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    
    .signature-section {
      margin-top: 60px;
      padding-top: 24px;
      border-top: 2px solid #e5e7eb;
    }
    
    .signature-block {
      display: flex;
      justify-content: space-between;
      gap: 40px;
    }
    
    .signature-item {
      flex: 1;
      text-align: center;
    }
    
    .signature-line {
      border-bottom: 2px solid #d1d5db;
      margin-bottom: 8px;
      height: 40px;
    }
    
    .signature-label {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    
    .footer-brand {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    @media print {
      .document-container { padding: 20px; }
      .signature-section { page-break-inside: avoid; }
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
          ${companySettings?.company_email ? `<p>📧 ${companySettings.company_email}</p>` : ''}
          ${companySettings?.company_phone ? `<p>📞 ${companySettings.company_phone}</p>` : ''}
        </div>
      </div>
      <div class="document-banner">
        <div class="document-title">${documentTitle} ${documentNumber}</div>
        ${getStatusBadge(document.status)}
      </div>
    </div>

    <!-- Document Info Bar -->
    <div class="info-bar">
      <div class="info-bar-content">
        <div class="info-item">
          <strong>${documentNumber}</strong>
          <span>${documentTitle} Number</span>
        </div>
        <div class="info-item">
          <strong>${new Date(document.created_at).toLocaleDateString()}</strong>
          <span>Date Issued</span>
        </div>
        ${isQuote && document.expiration_date ? `
          <div class="info-item">
            <strong>${new Date(document.expiration_date).toLocaleDateString()}</strong>
            <span>Expires</span>
          </div>
        ` : ''}
        ${!isQuote ? `
          <div class="info-item">
            <strong>${new Date(document.due_date).toLocaleDateString()}</strong>
            <span>Due Date</span>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Customer and Document Info -->
    <div class="document-info">
      <div class="info-card">
        <h3>📋 Bill To</h3>
        <div class="customer-name">${document.customers?.name || 'N/A'}</div>
        ${document.customers?.service_street ? `
          <div class="contact-item">
            <span>📍</span>
            <span>
              ${document.customers.service_street}<br>
              ${document.customers?.service_city || ''}, ${document.customers?.service_state || ''} ${document.customers?.service_zip || ''}
            </span>
          </div>
        ` : ''}
        ${document.customers?.email ? `
          <div class="contact-item">
            <span>✉️</span>
            <span>${document.customers.email}</span>
          </div>
        ` : ''}
        ${document.customers?.phone ? `
          <div class="contact-item">
            <span>☎️</span>
            <span>${document.customers.phone}</span>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 45%;">Item & Description</th>
          <th style="width: 15%;" class="text-center">Quantity</th>
          <th style="width: 20%;" class="text-right">Unit Price</th>
          <th style="width: 20%;" class="text-right">Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>
              <div class="item-name">${getProductName(item)}</div>
              ${item.variation_name ? `<div class="item-description">Variation: ${item.variation_name}</div>` : ''}
              ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
              ${item.rental_duration_days ? `<div class="item-description">Rental Duration: ${item.rental_duration_days} days</div>` : ''}
            </td>
            <td class="text-center" style="font-weight: 600;">${item.quantity}</td>
            <td class="text-right" style="font-weight: 500;">$${Number(item.unit_price || 0).toFixed(2)}</td>
            <td class="text-right" style="font-weight: 600; color: hsl(214, 83%, 56%);">$${Number(item.line_total || 0).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals Section -->
    <div class="totals-section">
      <div class="totals-card">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span style="font-weight: 600;">$${Number(document.subtotal || 0).toFixed(2)}</span>
        </div>
        ${document.discount_value && Number(document.discount_value) > 0 ? `
          <div class="totals-row">
            <span>Discount ${document.discount_type === 'percentage' ? '(%)' : ''}:</span>
            <span style="color: #dc2626; font-weight: 600;">-$${Number(document.discount_value).toFixed(2)}</span>
          </div>
        ` : ''}
        ${document.additional_fees && Number(document.additional_fees) > 0 ? `
          <div class="totals-row">
            <span>Additional Fees:</span>
            <span style="font-weight: 600;">$${Number(document.additional_fees).toFixed(2)}</span>
          </div>
        ` : ''}
        ${document.tax_amount && Number(document.tax_amount) > 0 ? `
          <div class="totals-row">
            <span>Tax:</span>
            <span style="font-weight: 600;">$${Number(document.tax_amount).toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="total-final">
          <span>TOTAL:</span>
          <span>$${Number(isQuote ? document.total_amount : document.amount).toFixed(2)}</span>
        </div>
      </div>
    </div>

    ${document.terms ? `
      <div class="terms-section">
        <h3 class="section-title">📋 Terms & Conditions</h3>
        <div class="section-content">${document.terms}</div>
      </div>
    ` : ''}

    ${document.notes ? `
      <div class="notes-section">
        <h3 class="section-title">📝 Notes</h3>
        <div class="section-content">${document.notes}</div>
      </div>
    ` : ''}

    ${isQuote ? `
      <div class="signature-section">
        <div class="signature-block">
          <div class="signature-item">
            <div class="signature-line"></div>
            <div class="signature-label">Customer Signature</div>
          </div>
          <div class="signature-item">
            <div class="signature-line"></div>
            <div class="signature-label">Date</div>
          </div>
        </div>
      </div>
    ` : ''}

    <div class="footer">
      <div class="footer-brand">${companySettings?.company_name || 'PortaPro'} - Professional Portable Toilet Rental Services</div>
      <div>Thank you for choosing us for your sanitation needs!</div>
      ${companySettings?.company_address ? `<div style="margin-top: 8px;">${companySettings.company_address}</div>` : ''}
    </div>
  </div>
</body>
</html>
  `;
}

serve(handler);