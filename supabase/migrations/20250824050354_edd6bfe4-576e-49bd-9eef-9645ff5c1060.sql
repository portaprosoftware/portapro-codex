-- First, let's see what statuses currently exist
-- Update existing 'pending' quote statuses to 'draft' to standardize with export modal
UPDATE public.quotes 
SET status = 'draft' 
WHERE status = 'pending';