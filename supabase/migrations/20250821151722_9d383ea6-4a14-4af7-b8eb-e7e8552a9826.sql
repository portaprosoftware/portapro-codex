-- Add better database linking for quotes and jobs
-- Update jobs table to have a stronger relationship with quotes

-- Add index for better performance on quote_id lookups
CREATE INDEX IF NOT EXISTS idx_jobs_quote_id ON public.jobs(quote_id);

-- Add a function to check if a quote already has a job
CREATE OR REPLACE FUNCTION public.quote_has_job(quote_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE quote_id = quote_uuid
  );
END;
$$;

-- Add a function to get jobs linked to a quote
CREATE OR REPLACE FUNCTION public.get_jobs_for_quote(quote_uuid uuid)
RETURNS TABLE(
  job_id uuid,
  job_number text,
  job_type text,
  status text,
  scheduled_date date,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.job_number,
    j.job_type,
    j.status,
    j.scheduled_date,
    j.created_at
  FROM public.jobs j
  WHERE j.quote_id = quote_uuid
  ORDER BY j.created_at DESC;
END;
$$;

-- Add trigger to automatically link jobs to quotes when job+quote are created together
CREATE OR REPLACE FUNCTION public.auto_link_job_to_quote()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If a job is created with a quote_id, ensure the quote exists and is accepted
  IF NEW.quote_id IS NOT NULL THEN
    -- Check if quote exists and is in proper state
    IF NOT EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE id = NEW.quote_id 
      AND status IN ('accepted', 'sent')
    ) THEN
      RAISE EXCEPTION 'Quote must exist and be in accepted or sent status to create linked job';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_link_job_to_quote ON public.jobs;
CREATE TRIGGER trigger_auto_link_job_to_quote
  BEFORE INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_job_to_quote();