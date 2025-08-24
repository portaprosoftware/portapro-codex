import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'npm:resend@2.0.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendInvoiceEmailRequest {
  invoiceId: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName: string;
  sendMethod: 'email' | 'sms' | 'both';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, customerEmail, customerPhone, customerName, sendMethod }: SendInvoiceEmailRequest = await req.json();

    console.log('Sending invoice:', { invoiceId, customerEmail, customerPhone, customerName, sendMethod });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers:customer_id (
          name,
          email,
          phone
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice fetch error:', invoiceError);
      throw new Error('Invoice not found');
    }

    // Get company settings for email/SMS configuration
    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single();

    const companyName = companySettings?.company_name || 'PortaPro';
    const companyEmail = companySettings?.company_email || 'invoices@portapro.com';
    const companyPhone = companySettings?.company_phone || '';

    // Format currency helper
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount || 0);
    };

    // Format date helper
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Get invoice items for email display
    const { data: invoiceItems } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId);

    // Generate invoice items HTML for email
    let itemsHTML = '';
    if (invoiceItems && invoiceItems.length > 0) {
      itemsHTML = invoiceItems.map(item => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; text-align: left;">${item.product_name}${item.variation_name ? ` - ${item.variation_name}` : ''}</td>
          <td style="padding: 12px; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; text-align: right;">${formatCurrency(item.unit_price)}</td>
          <td style="padding: 12px; text-align: right; font-weight: bold;">${formatCurrency(item.line_total)}</td>
        </tr>
      `).join('');
    } else {
      itemsHTML = `
        <tr>
          <td colspan="4" style="padding: 20px; text-align: center; color: #6b7280;">
            Invoice items will be provided separately
          </td>
        </tr>
      `;
    }

    // Build email HTML
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${invoice.invoice_number}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Invoice ${invoice.invoice_number}</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">From ${companyName}</p>
            </div>

            <!-- Invoice Details -->
            <div style="padding: 30px;">
              <div style="margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 20px;">Invoice Details</h2>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #6b7280;">Invoice Number:</span>
                    <span style="font-weight: bold; color: #1f2937;">${invoice.invoice_number}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #6b7280;">Invoice Date:</span>
                    <span style="color: #1f2937;">${formatDate(invoice.created_at)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #6b7280;">Due Date:</span>
                    <span style="color: #1f2937;">${formatDate(invoice.due_date)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #6b7280;">Amount Due:</span>
                    <span style="font-weight: bold; color: #dc2626; font-size: 18px;">${formatCurrency(invoice.amount)}</span>
                  </div>
                </div>
              </div>

              <!-- Line Items -->
              <div style="margin-bottom: 30px;">
                <h3 style="color: #1f2937; margin-bottom: 15px;">Invoice Items</h3>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #f9fafb;">
                      <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Item</th>
                      <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Qty</th>
                      <th style="padding: 12px; text-align: right; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Price</th>
                      <th style="padding: 12px; text-align: right; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHTML}
                  </tbody>
                </table>
              </div>

              <!-- Payment Summary -->
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="color: #1f2937; margin-bottom: 15px;">Payment Summary</h3>
                ${invoice.subtotal ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280;">Subtotal:</span>
                    <span style="color: #1f2937;">${formatCurrency(invoice.subtotal)}</span>
                  </div>
                ` : ''}
                ${invoice.tax_amount ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280;">Tax:</span>
                    <span style="color: #1f2937;">${formatCurrency(invoice.tax_amount)}</span>
                  </div>
                ` : ''}
                ${invoice.additional_fees ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280;">Additional Fees:</span>
                    <span style="color: #1f2937;">${formatCurrency(invoice.additional_fees)}</span>
                  </div>
                ` : ''}
                <div style="border-top: 1px solid #e5e7eb; margin-top: 10px; padding-top: 10px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: bold; color: #1f2937; font-size: 18px;">Total Amount:</span>
                    <span style="font-weight: bold; color: #dc2626; font-size: 18px;">${formatCurrency(invoice.amount)}</span>
                  </div>
                </div>
              </div>

              <!-- Payment Instructions -->
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 30px;">
                <h3 style="color: #92400e; margin-bottom: 10px;">Payment Instructions</h3>
                <p style="color: #92400e; margin: 0; line-height: 1.5;">
                  Please remit payment by ${formatDate(invoice.due_date)}. Contact us at ${companyPhone || companyEmail} for any questions regarding this invoice.
                </p>
              </div>

              ${invoice.notes ? `
                <div style="margin-bottom: 20px;">
                  <h3 style="color: #1f2937; margin-bottom: 10px;">Notes</h3>
                  <p style="color: #6b7280; line-height: 1.5; margin: 0;">${invoice.notes}</p>
                </div>
              ` : ''}

              ${invoice.terms ? `
                <div style="margin-bottom: 20px;">
                  <h3 style="color: #1f2937; margin-bottom: 10px;">Terms & Conditions</h3>
                  <p style="color: #6b7280; line-height: 1.5; margin: 0; font-size: 14px;">${invoice.terms}</p>
                </div>
              ` : ''}
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Thank you for your business!<br>
                ${companyName}
                ${companyPhone ? ` • ${companyPhone}` : ''}
                ${companyEmail ? ` • ${companyEmail}` : ''}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    let emailResponse = null;
    let smsResponse = null;

    // Send email if required
    if (sendMethod === 'email' || sendMethod === 'both') {
      if (!customerEmail) {
        throw new Error('Email address is required for email sending');
      }

      emailResponse = await resend.emails.send({
        from: `${companyName} <${companyEmail}>`,
        to: [customerEmail],
        subject: `Invoice ${invoice.invoice_number} from ${companyName}`,
        html: emailHTML,
      });

      console.log("Invoice email sent successfully:", emailResponse);
    }

    // Send SMS if required
    if (sendMethod === 'sms' || sendMethod === 'both') {
      if (!customerPhone) {
        throw new Error('Phone number is required for SMS sending');
      }

      // Validate E.164 format for Twilio
      const phoneDigits = customerPhone.replace(/\D/g, '');
      let twilioToPhone = customerPhone;
      if (phoneDigits.length === 10) {
        twilioToPhone = `+1${phoneDigits}`;
      } else if (!customerPhone.startsWith('+1') && phoneDigits.length === 11 && phoneDigits.startsWith('1')) {
        twilioToPhone = `+${phoneDigits}`;
      }
      
      if (!twilioToPhone.match(/^\+1\d{10}$/)) {
        throw new Error('Phone number must be a valid US number for SMS sending');
      }

      // Twilio SMS functionality
      const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

      if (!twilioSid || !twilioToken || !twilioPhone) {
        throw new Error('Twilio credentials not configured');
      }

      const smsMessage = `Hi ${customerName}! Your invoice ${invoice.invoice_number} from ${companyName} is ready. Amount due: ${formatCurrency(invoice.amount)}. Due date: ${formatDate(invoice.due_date)}. Contact us at ${companyPhone} for questions. Thank you!`;

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const auth = btoa(`${twilioSid}:${twilioToken}`);
      
      const smsPayload = new URLSearchParams({
        From: twilioPhone,
        To: twilioToPhone,
        Body: smsMessage
      });

      const twilioResponse = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: smsPayload.toString(),
      });

      if (!twilioResponse.ok) {
        const errorText = await twilioResponse.text();
        throw new Error(`SMS sending failed: ${errorText}`);
      }

      smsResponse = await twilioResponse.json();
      console.log("Invoice SMS sent successfully:", smsResponse);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse?.data?.id,
      smsId: smsResponse?.sid,
      message: `Invoice sent successfully via ${sendMethod}` 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invoice function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);