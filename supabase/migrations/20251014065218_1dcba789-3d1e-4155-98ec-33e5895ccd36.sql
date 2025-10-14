-- Add deposit tracking columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS deposit_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_amount numeric,
ADD COLUMN IF NOT EXISTS deposit_type text CHECK (deposit_type IN ('flat', 'percentage')),
ADD COLUMN IF NOT EXISTS deposit_percentage numeric,
ADD COLUMN IF NOT EXISTS deposit_status text DEFAULT 'pending' CHECK (deposit_status IN ('pending', 'paid', 'overdue', 'waived')),
ADD COLUMN IF NOT EXISTS deposit_due_date date,
ADD COLUMN IF NOT EXISTS deposit_paid_at timestamp with time zone;

-- Add deposit tracking columns to invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS deposit_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_amount numeric,
ADD COLUMN IF NOT EXISTS deposit_type text CHECK (deposit_type IN ('flat', 'percentage')),
ADD COLUMN IF NOT EXISTS deposit_percentage numeric,
ADD COLUMN IF NOT EXISTS deposit_status text DEFAULT 'pending' CHECK (deposit_status IN ('pending', 'paid', 'overdue', 'waived')),
ADD COLUMN IF NOT EXISTS deposit_payment_id uuid REFERENCES public.payments(id);

-- Create trigger function to auto-update deposit status on payment completion
CREATE OR REPLACE FUNCTION update_deposit_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.payment_type = 'deposit' THEN
    -- Update related job
    IF NEW.job_id IS NOT NULL THEN
      UPDATE public.jobs 
      SET deposit_status = 'paid', deposit_paid_at = NEW.paid_at
      WHERE id = NEW.job_id;
    END IF;
    
    -- Update related quote
    IF NEW.quote_id IS NOT NULL THEN
      UPDATE public.quotes 
      SET deposit_status = 'paid', deposit_paid_at = NEW.paid_at
      WHERE id = NEW.quote_id;
    END IF;
    
    -- Update related invoice
    IF NEW.invoice_id IS NOT NULL THEN
      UPDATE public.invoices 
      SET deposit_status = 'paid', deposit_payment_id = NEW.id
      WHERE id = NEW.invoice_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on payments table
DROP TRIGGER IF EXISTS on_payment_completed ON public.payments;
CREATE TRIGGER on_payment_completed
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_deposit_status_on_payment();