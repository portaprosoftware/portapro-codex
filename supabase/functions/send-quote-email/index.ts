import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendQuoteEmailRequest {
  quoteId: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName: string;
  sendMethod: 'email' | 'sms' | 'both';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId, customerEmail, customerPhone, customerName, sendMethod }: SendQuoteEmailRequest = await req.json();

    console.log('Sending quote:', { quoteId, customerEmail, customerPhone, customerName, sendMethod });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch quote details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        customers:customer_id (
          name,
          email,
          service_street,
          service_street2,
          service_city,
          service_state,
          service_zip
        )
      `)
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      throw new Error(`Quote not found: ${quoteError?.message}`);
    }

    // Fetch quote items
    const { data: quoteItems, error: itemsError } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId);

    if (itemsError) {
      throw new Error(`Failed to fetch quote items: ${itemsError.message}`);
    }

    // Fetch company settings for branding
    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('company_name, company_email, company_phone')
      .single();

    const companyName = companySettings?.company_name || 'PortaPro';
    const companyEmail = companySettings?.company_email || 'hello@portaprosoftware.com';
    const companyPhone = companySettings?.company_phone || '';
    
    // Determine a safe From address for Resend
    // Use RESEND_FROM if set (e.g., no-reply@yourdomain.com with verified domain),
    // otherwise fall back to Resend's sandbox domain for development.
    const resendFromEnv = Deno.env.get('RESEND_FROM');
    const fromAddress = resendFromEnv
      ? `${companyName} <${resendFromEnv}>`
      : `${companyName} <onboarding@resend.dev>`;
    
    // Format currency
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount || 0);
    };

    // Format date
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    };

    // Build items HTML
    const itemsHTML = quoteItems?.map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">${item.product_name}</td>
        <td style="padding: 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right;">${formatCurrency(item.unit_price)}</td>
        <td style="padding: 12px; text-align: right; font-weight: 600;">${formatCurrency(item.line_total)}</td>
      </tr>
    `).join('') || '';

    // Create email HTML
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Quote ${quote.quote_number}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${companyName}</h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Professional Portable Toilet Rentals</p>
            </div>

            <!-- Quote Header -->
            <div style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
              <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #1f2937;">Quote ${quote.quote_number}</h2>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Date:</strong> ${formatDate(quote.created_at)}</p>
                  ${quote.expiration_date ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;"><strong>Expires:</strong> ${formatDate(quote.expiration_date)}</p>` : ''}
                </div>
                <div>
                  <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Customer:</strong> ${customerName}</p>
                  <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">${customerEmail}</p>
                </div>
              </div>
            </div>

            <!-- Quote Items -->
            <div style="padding: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #1f2937;">Quote Details</h3>
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Item</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Unit Price</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
            </div>

            <!-- Totals -->
            <div style="padding: 0 24px 24px 24px;">
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
                ${quote.subtotal ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280;">Subtotal:</span>
                    <span style="font-weight: 600;">${formatCurrency(quote.subtotal)}</span>
                  </div>
                ` : ''}
                ${quote.discount_value > 0 ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280;">Discount:</span>
                    <span style="font-weight: 600; color: #dc2626;">-${formatCurrency(quote.discount_type === 'percentage' ? (quote.subtotal * quote.discount_value / 100) : quote.discount_value)}</span>
                  </div>
                ` : ''}
                ${quote.tax_amount > 0 ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280;">Tax:</span>
                    <span style="font-weight: 600;">${formatCurrency(quote.tax_amount)}</span>
                  </div>
                ` : ''}
                ${quote.additional_fees > 0 ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6b7280;">Additional Fees:</span>
                    <span style="font-weight: 600;">${formatCurrency(quote.additional_fees)}</span>
                  </div>
                ` : ''}
                <hr style="margin: 12px 0; border: none; border-top: 1px solid #d1d5db;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-size: 18px; font-weight: bold; color: #1f2937;">Total:</span>
                  <span style="font-size: 18px; font-weight: bold; color: #3b82f6;">${formatCurrency(quote.total_amount)}</span>
                </div>
              </div>
            </div>

            ${quote.notes ? `
              <!-- Notes -->
              <div style="padding: 0 24px 24px 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937;">Notes</h3>
                <p style="margin: 0; color: #6b7280; line-height: 1.5;">${quote.notes}</p>
              </div>
            ` : ''}

            ${quote.terms ? `
              <!-- Terms -->
              <div style="padding: 0 24px 24px 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937;">Terms & Conditions</h3>
                <p style="margin: 0; color: #6b7280; line-height: 1.5; font-size: 14px;">${quote.terms}</p>
              </div>
            ` : ''}

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${companyName}</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                ${companyEmail}${companyPhone ? ` • ${companyPhone}` : ''}
              </p>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
                Thank you for choosing ${companyName} for your portable toilet rental needs!
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

      // Ensure Resend is configured
      if (!Deno.env.get('RESEND_API_KEY')) {
        throw new Error('RESEND_API_KEY is not configured. Add it in Supabase Edge Functions secrets.');
      }

      emailResponse = await resend.emails.send({
        from: fromAddress,
        to: [customerEmail],
        reply_to: companyEmail ? [companyEmail] : undefined,
        subject: `Quote ${quote.quote_number} from ${companyName}`,
        html: emailHTML,
      });

      console.log("Quote email sent successfully:", emailResponse);
    }
    
    // Send SMS if required
    if (sendMethod === 'sms' || sendMethod === 'both') {
      if (!customerPhone) {
        throw new Error('Phone number is required for SMS sending');
      }

      // Validate E.164 format for Twilio
      const phoneDigits = customerPhone.replace(/\D/g, '');
      let twilioPhone = customerPhone;
      if (phoneDigits.length === 10) {
        twilioPhone = `+1${phoneDigits}`;
      } else if (!customerPhone.startsWith('+1') && phoneDigits.length === 11 && phoneDigits.startsWith('1')) {
        twilioPhone = `+${phoneDigits}`;
      }
      
      if (!twilioPhone.match(/^\+1\d{10}$/)) {
        throw new Error('Phone number must be a valid US number for SMS sending');
      }

      // Twilio SMS functionality
      const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioFromPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

      if (!twilioSid || !twilioToken || !twilioFromPhone) {
        throw new Error('Twilio credentials not configured');
      }

      const smsMessage = `Hi ${customerName}! Your quote ${quote.quote_number} from ${companyName} is ready. Total: ${formatCurrency(quote.total_amount)}. Contact us at ${companyPhone} for questions. Thank you!`;

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const auth = btoa(`${twilioSid}:${twilioToken}`);
      
      const smsPayload = new URLSearchParams({
        From: twilioFromPhone,
        To: twilioPhone,
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
      console.log("Quote SMS sent successfully:", smsResponse);
    }

    // Update quote to mark as sent
    await supabase
      .from('quotes')
      .update({ 
        status: quote.status === 'draft' ? 'sent' : quote.status,
        sent_at: new Date().toISOString()
      })
      .eq('id', quoteId);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse?.data?.id,
      smsId: smsResponse?.sid,
      message: `Quote sent successfully via ${sendMethod}` 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-quote function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);