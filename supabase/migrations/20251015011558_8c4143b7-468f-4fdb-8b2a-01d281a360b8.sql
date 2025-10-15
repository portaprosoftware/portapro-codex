-- Add delivery_fee column to jobs table
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;

-- Add delivery_fee column to quotes table
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;

-- Add helpful comments
COMMENT ON COLUMN public.jobs.delivery_fee IS 'Delivery or additional service fee amount for this job';
COMMENT ON COLUMN public.quotes.delivery_fee IS 'Delivery or additional service fee amount for this quote';