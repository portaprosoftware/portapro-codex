-- Update existing 'pending' quote statuses to 'draft' to standardize with export modal
UPDATE public.quotes 
SET status = 'draft' 
WHERE status = 'pending';

-- Ensure we have consistent quote statuses by adding a check constraint
-- Valid statuses are: draft, sent, accepted, rejected, expired
ALTER TABLE public.quotes 
ADD CONSTRAINT quotes_status_check 
CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired'));