import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DepositNotificationRequest {
  to: string;
  customerName: string;
  amount: number;
  type: 'request' | 'confirmation' | 'reminder' | 'failed' | 'refund';
  paymentId?: string;
  quoteNumber?: string;
  invoiceNumber?: string;
  dueDate?: string;
  paymentLink?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      to,
      customerName,
      amount,
      type,
      paymentId,
      quoteNumber,
      invoiceNumber,
      dueDate,
      paymentLink,
    }: DepositNotificationRequest = await req.json();

    console.log('Sending deposit notification:', { to, type, amount });

    let subject = '';
    let html = '';

    switch (type) {
      case 'request':
        subject = `Deposit Required: ${quoteNumber || invoiceNumber}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Deposit Payment Required</h1>
            <p>Hello ${customerName},</p>
            <p>A deposit of <strong>$${amount.toFixed(2)}</strong> is required for ${quoteNumber ? `quote ${quoteNumber}` : `invoice ${invoiceNumber}`}.</p>
            ${dueDate ? `<p>Due date: <strong>${new Date(dueDate).toLocaleDateString()}</strong></p>` : ''}
            ${paymentLink ? `
              <div style="margin: 30px 0;">
                <a href="${paymentLink}" 
                   style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Pay Deposit Now
                </a>
              </div>
            ` : ''}
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>Your Team</p>
          </div>
        `;
        break;

      case 'confirmation':
        subject = 'Deposit Payment Received';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10B981;">Payment Confirmed!</h1>
            <p>Hello ${customerName},</p>
            <p>We have successfully received your deposit payment of <strong>$${amount.toFixed(2)}</strong>.</p>
            <p>Payment Reference: <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${paymentId}</code></p>
            <p>Thank you for your payment. We're looking forward to serving you!</p>
            <p>Best regards,<br>Your Team</p>
          </div>
        `;
        break;

      case 'reminder':
        subject = `Reminder: Deposit Payment Due ${dueDate ? `on ${new Date(dueDate).toLocaleDateString()}` : 'Soon'}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #F59E0B;">Payment Reminder</h1>
            <p>Hello ${customerName},</p>
            <p>This is a friendly reminder that a deposit payment of <strong>$${amount.toFixed(2)}</strong> is ${dueDate ? `due on ${new Date(dueDate).toLocaleDateString()}` : 'still pending'}.</p>
            ${paymentLink ? `
              <div style="margin: 30px 0;">
                <a href="${paymentLink}" 
                   style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Pay Now
                </a>
              </div>
            ` : ''}
            <p>If you've already made this payment, please disregard this message.</p>
            <p>Best regards,<br>Your Team</p>
          </div>
        `;
        break;

      case 'failed':
        subject = 'Deposit Payment Failed';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #EF4444;">Payment Failed</h1>
            <p>Hello ${customerName},</p>
            <p>We were unable to process your deposit payment of <strong>$${amount.toFixed(2)}</strong>.</p>
            <p>Please check your payment method and try again, or contact us for assistance.</p>
            ${paymentLink ? `
              <div style="margin: 30px 0;">
                <a href="${paymentLink}" 
                   style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Try Again
                </a>
              </div>
            ` : ''}
            <p>If you need help, please contact our support team.</p>
            <p>Best regards,<br>Your Team</p>
          </div>
        `;
        break;

      case 'refund':
        subject = 'Deposit Refund Processed';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6366F1;">Refund Processed</h1>
            <p>Hello ${customerName},</p>
            <p>Your deposit of <strong>$${amount.toFixed(2)}</strong> has been refunded.</p>
            <p>The refund should appear in your account within 5-10 business days, depending on your bank.</p>
            <p>Payment Reference: <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${paymentId}</code></p>
            <p>If you have any questions about this refund, please contact us.</p>
            <p>Best regards,<br>Your Team</p>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    const { data, error } = await resend.emails.send({
      from: 'PortaPro <notifications@resend.dev>',
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-deposit-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
