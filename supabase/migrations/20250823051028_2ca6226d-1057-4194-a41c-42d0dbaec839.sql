-- Create payments table to track invoice payments and reversals
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  payment_method TEXT NOT NULL, -- e.g., 'credit_card', 'cash', 'check', 'bank_transfer'
  reference_number TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'reversed'
  stripe_payment_intent_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT, -- Clerk user id
  reversed_at TIMESTAMPTZ,
  reversed_by TEXT,
  reversal_reason TEXT,
  original_payment_id UUID REFERENCES public.payments(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id_created_at 
  ON public.payments(invoice_id, created_at DESC);

-- Helper function to get payment totals for an invoice
CREATE OR REPLACE FUNCTION public.get_invoice_payment_totals(invoice_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  paid numeric := 0;
  reversed numeric := 0;
  net numeric := 0;
BEGIN
  SELECT COALESCE(SUM(amount),0) INTO paid 
  FROM public.payments 
  WHERE invoice_id = invoice_uuid AND status = 'completed';

  SELECT COALESCE(SUM(amount),0) INTO reversed 
  FROM public.payments 
  WHERE invoice_id = invoice_uuid AND status = 'reversed';

  net := GREATEST(paid - reversed, 0);
  RETURN jsonb_build_object('total_paid', paid, 'total_reversed', reversed, 'net_paid', net);
END;
$function$;