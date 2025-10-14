-- Add deposit tracking columns to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS deposit_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_amount numeric,
ADD COLUMN IF NOT EXISTS deposit_type text CHECK (deposit_type IN ('fixed', 'percentage')),
ADD COLUMN IF NOT EXISTS deposit_percentage numeric,
ADD COLUMN IF NOT EXISTS deposit_status text DEFAULT 'pending' CHECK (deposit_status IN ('pending', 'paid', 'overdue', 'waived')),
ADD COLUMN IF NOT EXISTS deposit_due_date date,
ADD COLUMN IF NOT EXISTS deposit_paid_at timestamp with time zone;