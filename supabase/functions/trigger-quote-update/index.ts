import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuoteUpdateRequest {
  quoteId: string;
  customerId: string;
  quoteNumber: string;
  customerName: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  totalAmount: number;
  validUntil?: string;
  quoteLink?: string;
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

    const payload: QuoteUpdateRequest = await req.json();
    console.log('[Quote Update] Processing notification:', payload);

    // Get customer email
    const { data: customer } = await supabase
      .from('customers')
      .select('email, contact_email')
      .eq('id', payload.customerId)
      .single();

    const customerEmail = customer?.email || customer?.contact_email;

    // Construct content based on status
    let subject = '';
    let emailContent = '';
    let priority: 'low' | 'normal' | 'high' = 'normal';

    switch (payload.status) {
      case 'sent':
        subject = `Quote ${payload.quoteNumber} - Ready for Review`;
        priority = 'high';
        emailContent = `
          <h2 style="color: #059669; margin-bottom: 16px;">New Quote Available</h2>
          <p>Hi ${payload.customerName},</p>
          <p>Your quote <strong>${payload.quoteNumber}</strong> is ready for review.</p>
          <div style="margin: 20px 0; padding: 16px; background: #f0fdf4; border-left: 4px solid #059669; border-radius: 4px;">
            <p style="margin: 0;"><strong>Total Amount:</strong> $${payload.totalAmount.toFixed(2)}</p>
            ${payload.validUntil ? `<p style="margin: 8px 0 0 0;"><strong>Valid Until:</strong> ${new Date(payload.validUntil).toLocaleDateString()}</p>` : ''}
          </div>
          ${payload.quoteLink ? `
            <a href="${payload.quoteLink}" style="display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px;">
              View Quote
            </a>
          ` : ''}
        `;
        break;
      case 'accepted':
        subject = `✅ Quote ${payload.quoteNumber} Accepted`;
        priority = 'high';
        emailContent = `
          <h2 style="color: #059669; margin-bottom: 16px;">Quote Accepted!</h2>
          <p>Great news! Quote <strong>${payload.quoteNumber}</strong> for ${payload.customerName} has been accepted.</p>
          <p><strong>Amount:</strong> $${payload.totalAmount.toFixed(2)}</p>
          <p>Next steps: Convert to job and schedule service.</p>
        `;
        break;
      case 'declined':
        subject = `❌ Quote ${payload.quoteNumber} Declined`;
        emailContent = `
          <h2 style="color: #dc2626; margin-bottom: 16px;">Quote Declined</h2>
          <p>Quote <strong>${payload.quoteNumber}</strong> for ${payload.customerName} has been declined.</p>
          <p><strong>Amount:</strong> $${payload.totalAmount.toFixed(2)}</p>
          <p>Consider following up with the customer to understand their concerns.</p>
        `;
        break;
      case 'expired':
        subject = `⏰ Quote ${payload.quoteNumber} Expired`;
        emailContent = `
          <h2 style="color: #f59e0b; margin-bottom: 16px;">Quote Expired</h2>
          <p>Quote <strong>${payload.quoteNumber}</strong> for ${payload.customerName} has expired.</p>
          <p><strong>Amount:</strong> $${payload.totalAmount.toFixed(2)}</p>
          <p>You may want to reach out to the customer with an updated quote.</p>
        `;
        break;
    }

    // Send to customer for sent status
    if (payload.status === 'sent' && customerEmail) {
      await supabase.functions.invoke('send-notification-email', {
        body: {
          userId: payload.customerId,
          subject,
          content: emailContent,
          priority,
          recipientEmail: customerEmail
        }
      });
    }

    // Notify team members for accepted, declined, expired
    if (payload.notifyTeam && payload.teamUserIds && ['accepted', 'declined', 'expired'].includes(payload.status)) {
      for (const userId of payload.teamUserIds) {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            userId,
            subject,
            content: emailContent,
            priority
          }
        });

        await supabase.functions.invoke('send-push-notification', {
          body: {
            userId,
            title: subject,
            body: `${payload.customerName} - $${payload.totalAmount.toFixed(2)}`,
            data: {
              type: 'quote_update',
              quoteId: payload.quoteId,
              status: payload.status
            }
          }
        });
      }
    }

    console.log('[Quote Update] Notifications sent successfully');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[Quote Update] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
};

serve(handler);
