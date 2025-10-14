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
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, ...params } = await req.json();

    console.log('Stripe action:', action, 'Params:', params);

    // Create Payment Intent
    if (action === 'create_payment_intent') {
      const { amount, customerId, jobId, quoteId, invoiceId, paymentType, description } = params;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          customer_id: customerId,
          job_id: jobId || '',
          quote_id: quoteId || '',
          invoice_id: invoiceId || '',
          payment_type: paymentType || 'deposit',
        },
        description: description || 'Deposit payment',
      });

      // Create payment record in database
      const { data: payment, error: dbError } = await supabase
        .from('payments')
        .insert({
          customer_id: customerId,
          job_id: jobId,
          quote_id: quoteId,
          invoice_id: invoiceId,
          amount,
          payment_type: paymentType || 'deposit',
          payment_method: 'stripe',
          stripe_payment_intent_id: paymentIntent.id,
          status: 'pending',
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      return new Response(
        JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          paymentId: payment.id,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Payment Link
    if (action === 'create_payment_link') {
      const { amount, customerId, jobId, quoteId, invoiceId, paymentType, description } = params;

      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: description || 'Deposit Payment',
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          customer_id: customerId,
          job_id: jobId || '',
          quote_id: quoteId || '',
          invoice_id: invoiceId || '',
          payment_type: paymentType || 'deposit',
        },
      });

      // Create payment record
      const { data: payment, error: dbError } = await supabase
        .from('payments')
        .insert({
          customer_id: customerId,
          job_id: jobId,
          quote_id: quoteId,
          invoice_id: invoiceId,
          amount,
          payment_type: paymentType || 'deposit',
          payment_method: 'stripe',
          stripe_payment_link_id: paymentLink.id,
          status: 'pending',
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      return new Response(
        JSON.stringify({
          paymentLink: paymentLink.url,
          paymentLinkId: paymentLink.id,
          paymentId: payment.id,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Payment Status
    if (action === 'get_payment_status') {
      const { paymentIntentId } = params;

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return new Response(
        JSON.stringify({
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in stripe-payment-intent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
