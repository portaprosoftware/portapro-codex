-- Remove the existing constraint first
ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_status_check;

-- Update existing 'pending' quote statuses to 'draft' to standardize with export modal
UPDATE public.quotes 
SET status = 'draft' 
WHERE status = 'pending';

-- Add the correct constraint with valid quote statuses
ALTER TABLE public.quotes 
ADD CONSTRAINT quotes_status_check 
CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired'));