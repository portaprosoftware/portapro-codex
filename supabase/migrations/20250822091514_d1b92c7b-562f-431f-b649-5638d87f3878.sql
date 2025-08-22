-- Add job_id reference to invoices table for linking invoices to jobs
ALTER TABLE public.invoices ADD COLUMN job_id UUID REFERENCES public.jobs(id);

-- Add index for faster lookups
CREATE INDEX idx_invoices_job_id ON public.invoices(job_id);

-- Add comment to document the relationship
COMMENT ON COLUMN public.invoices.job_id IS 'Optional reference to the job this invoice was created from';

-- Update the useCreateInvoiceFromJob hook functionality will be implemented in frontend