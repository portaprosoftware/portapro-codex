-- Add constraint for standardized invoice statuses to match export modal
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('draft', 'sent', 'paid', 'unpaid', 'overdue', 'cancelled'));