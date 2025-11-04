import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentConfirmationRequest {
  invoiceId: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  paymentDate: string;
  receiptUrl?: string;
  notifyTeam?: boolean;
  teamUserIds?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: PaymentConfirmationRequest = await req.json();
    console.log('[Payment Confirmation] Processing notification:', payload);

    // Get customer email
    const { data: customer } = await supabase
      .from('customers')
      .select('email, contact_email')
      .eq('id', payload.customerId)
      .single();

    const customerEmail = customer?.email || customer?.contact_email;

    // Customer receipt email
    const customerSubject = `✅ Payment Received - Invoice ${payload.invoiceNumber}`;
    const customerEmailContent = `
      <h2 style="color: #059669; margin-bottom: 16px;">Payment Received</h2>
      <p>Hi ${payload.customerName},</p>
      <p>Thank you! We've received your payment.</p>
      <div style="margin: 20px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid #059669; border-radius: 8px;">
        <p style="margin: 0;"><strong>Invoice:</strong> ${payload.invoiceNumber}</p>
        <p style="margin: 8px 0 0 0;"><strong>Amount:</strong> $${payload.amount.toFixed(2)}</p>
        <p style="margin: 8px 0 0 0;"><strong>Payment Method:</strong> ${payload.paymentMethod}</p>
        <p style="margin: 8px 0 0 0;"><strong>Date:</strong> ${new Date(payload.paymentDate).toLocaleDateString()}</p>
        ${payload.transactionId ? `<p style="margin: 8px 0 0 0;"><strong>Transaction ID:</strong> ${payload.transactionId}</p>` : ''}
      </div>
      ${payload.receiptUrl ? `
        <a href="${payload.receiptUrl}" style="display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px;">
          Download Receipt
        </a>
      ` : ''}
      <div style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          Thank you for your business! If you have any questions, please don't hesitate to contact us.
        </p>
      </div>
    `;

    // Send to customer
    if (customerEmail) {
      await supabase.functions.invoke('send-notification-email', {
        body: {
          userId: payload.customerId,
          subject: customerSubject,
          content: customerEmailContent,
          priority: 'normal',
          recipientEmail: customerEmail
        }
      });
    }

    // Team notification
    if (payload.notifyTeam && payload.teamUserIds) {
      const teamSubject = `💰 Payment Received - ${payload.customerName}`;
      const teamEmailContent = `
        <h2 style="color: #059669; margin-bottom: 16px;">Payment Received</h2>
        <p>Payment has been received from ${payload.customerName}.</p>
        <div style="margin: 20px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid #059669; border-radius: 8px;">
          <p style="margin: 0;"><strong>Invoice:</strong> ${payload.invoiceNumber}</p>
          <p style="margin: 8px 0 0 0;"><strong>Amount:</strong> $${payload.amount.toFixed(2)}</p>
          <p style="margin: 8px 0 0 0;"><strong>Payment Method:</strong> ${payload.paymentMethod}</p>
          <p style="margin: 8px 0 0 0;"><strong>Customer:</strong> ${payload.customerName}</p>
          ${payload.transactionId ? `<p style="margin: 8px 0 0 0;"><strong>Transaction ID:</strong> ${payload.transactionId}</p>` : ''}
        </div>
      `;

      for (const userId of payload.teamUserIds) {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            userId,
            subject: teamSubject,
            content: teamEmailContent,
            priority: 'normal'
          }
        });

        await supabase.functions.invoke('send-push-notification', {
          body: {
            userId,
            title: teamSubject,
            body: `$${payload.amount.toFixed(2)} - Invoice ${payload.invoiceNumber}`,
            data: {
              type: 'payment_confirmation',
              invoiceId: payload.invoiceId,
              amount: payload.amount
            }
          }
        });
      }
    }

    console.log('[Payment Confirmation] Notifications sent successfully');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[Payment Confirmation] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
};

serve(handler);
