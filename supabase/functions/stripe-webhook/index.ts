import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // For testing without webhook signature
      event = JSON.parse(body);
    }

    console.log('Stripe webhook event:', event.type);

    // Handle payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log('Payment succeeded:', paymentIntent.id);

      // Update payment record
      const { data: payment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating payment:', updateError);
        throw updateError;
      }

      console.log('Payment record updated:', payment?.id);
    }

    // Handle payment_intent.payment_failed
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log('Payment failed:', paymentIntent.id);

      await supabase
        .from('payments')
        .update({
          status: 'failed',
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);
    }

    // Handle checkout.session.completed (for payment links and invoice payments)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Checkout session completed:', session.id);

      // Handle invoice payments
      if (session.metadata?.invoice_id && session.metadata?.payment_id) {
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq('id', session.metadata.payment_id)
          .select()
          .single();

        if (paymentError) {
          console.error('Error updating payment:', paymentError);
        } else {
          // Update invoice status
          const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('amount')
            .eq('id', session.metadata.invoice_id)
            .single();

          if (!invoiceError && invoice) {
            // Check total paid amount for this invoice
            const { data: payments } = await supabase
              .from('payments')
              .select('amount')
              .eq('invoice_id', session.metadata.invoice_id)
              .eq('status', 'completed');

            const totalPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
            const newStatus = totalPaid >= invoice.amount ? 'paid' : 'partial';

            await supabase
              .from('invoices')
              .update({ status: newStatus, updated_at: new Date().toISOString() })
              .eq('id', session.metadata.invoice_id);

            console.log('Invoice status updated to:', newStatus);
          }
        }
      }
      
      // Handle payment links (existing functionality)
      if (session.payment_intent && session.metadata?.payment_link_id) {
        await supabase
          .from('payments')
          .update({
            status: 'completed',
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq('stripe_payment_link_id', session.metadata.payment_link_id);
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
