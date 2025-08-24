-- Add contact_id to jobs table to link jobs to specific customer contacts
ALTER TABLE public.jobs 
ADD COLUMN contact_id uuid REFERENCES public.customer_contacts(id);

-- Add index for better query performance
CREATE INDEX idx_jobs_contact_id ON public.jobs(contact_id);