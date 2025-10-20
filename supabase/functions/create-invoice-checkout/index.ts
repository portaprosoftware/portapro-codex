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

    const { invoiceId, amount, isPublic = false } = await req.json();

    console.log('Creating checkout session for invoice:', invoiceId, 'Amount:', amount);

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, customers(*)')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    // Validate amount
    if (amount <= 0 || amount > invoice.amount) {
      throw new Error('Invalid payment amount');
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        invoice_id: invoiceId,
        customer_id: invoice.customer_id,
        amount: amount,
        payment_method: 'credit_card',
        payment_type: 'invoice',
        status: 'pending',
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment record error:', paymentError);
      throw paymentError;
    }

    // Create Stripe Checkout Session
    const origin = req.headers.get('origin') || 'http://localhost:8080';
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: `Payment for ${invoice.customers?.name || 'Customer'}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      customer_email: invoice.customers?.email || undefined,
      metadata: {
        invoice_id: invoiceId,
        payment_id: payment.id,
        customer_id: invoice.customer_id,
      },
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&invoice_id=${invoiceId}`,
      cancel_url: `${origin}/payment-canceled?invoice_id=${invoiceId}`,
    });

    // Update payment record with Stripe session ID
    await supabase
      .from('payments')
      .update({
        stripe_payment_intent_id: session.payment_intent as string || null,
        reference_number: session.id,
      })
      .eq('id', payment.id);

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        checkoutUrl: session.url,
        paymentId: payment.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in create-invoice-checkout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
