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
    const pdfHtml = generatePdfHtml(documentData, items, requestData.type);

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
        pdf_available: requestData.action === 'generate_pdf' || requestData.action === 'both'
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

function generatePdfHtml(document: any, items: any[], type: 'quote' | 'invoice'): string {
  const isQuote = type === 'quote';
  const documentNumber = isQuote ? document.quote_number : document.invoice_number;
  const documentTitle = isQuote ? 'QUOTE' : 'INVOICE';
  
  return `
    <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px;">
        <div>
          <h1 style="color: #2563eb; margin: 0; font-size: 28px;">${documentTitle}</h1>
          <p style="margin: 5px 0; color: #666;">${documentNumber}</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; color: #333;">PortaPro</h2>
          <p style="margin: 5px 0; color: #666;">Portable Toilet Rental Services</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
        <div>
          <h3 style="margin: 0 0 10px 0; color: #333;">Bill To:</h3>
          <div style="color: #666;">
            <p style="margin: 5px 0; font-weight: bold;">${document.customers?.name || 'N/A'}</p>
            <p style="margin: 5px 0;">${document.customers?.service_street || ''}</p>
            <p style="margin: 5px 0;">${document.customers?.service_city || ''}, ${document.customers?.service_state || ''} ${document.customers?.service_zip || ''}</p>
            <p style="margin: 5px 0;">Email: ${document.customers?.email || 'N/A'}</p>
            <p style="margin: 5px 0;">Phone: ${document.customers?.phone || 'N/A'}</p>
          </div>
        </div>
        <div>
          <h3 style="margin: 0 0 10px 0; color: #333;">${isQuote ? 'Quote' : 'Invoice'} Details:</h3>
          <div style="color: #666;">
            <p style="margin: 5px 0;"><strong>${isQuote ? 'Quote' : 'Invoice'} #:</strong> ${documentNumber}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(document.created_at).toLocaleDateString()}</p>
            ${isQuote ? `<p style="margin: 5px 0;"><strong>Expires:</strong> ${document.expiration_date ? new Date(document.expiration_date).toLocaleDateString() : 'N/A'}</p>` : ''}
            ${!isQuote ? `<p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(document.due_date).toLocaleDateString()}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Status:</strong> ${document.status}</p>
          </div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Quantity</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Unit Price</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                <strong>${item.product_name}</strong>
                ${item.variation_name ? `<br><small style="color: #666;">${item.variation_name}</small>` : ''}
                ${item.description ? `<br><small style="color: #666;">${item.description}</small>` : ''}
              </td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">${item.quantity}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">$${Number(item.unit_price).toFixed(2)}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">$${Number(item.line_total).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
            <span>Subtotal:</span>
            <span>$${Number(document.subtotal || 0).toFixed(2)}</span>
          </div>
          ${document.discount_value > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
              <span>Discount ${document.discount_type === 'percentage' ? '(%)' : ''}:</span>
              <span>-$${Number(document.discount_value || 0).toFixed(2)}</span>
            </div>
          ` : ''}
          ${document.additional_fees > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
              <span>Additional Fees:</span>
              <span>$${Number(document.additional_fees || 0).toFixed(2)}</span>
            </div>
          ` : ''}
          ${document.tax_amount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
              <span>Tax:</span>
              <span>$${Number(document.tax_amount || 0).toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 12px 0; font-weight: bold; font-size: 18px; background-color: #f8f9fa; margin-top: 10px; border-radius: 4px; padding-left: 10px; padding-right: 10px;">
            <span>Total:</span>
            <span>$${Number(isQuote ? document.total_amount : document.amount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      ${document.terms ? `
        <div style="margin-top: 40px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Terms & Conditions:</h3>
          <p style="margin: 0; color: #666; white-space: pre-wrap;">${document.terms}</p>
        </div>
      ` : ''}

      ${document.notes ? `
        <div style="margin-top: 20px; padding: 20px; background-color: #fff3cd; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Notes:</h3>
          <p style="margin: 0; color: #666; white-space: pre-wrap;">${document.notes}</p>
        </div>
      ` : ''}
    </div>
  `;
}

serve(handler);