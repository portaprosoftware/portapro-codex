-- Add cancellation tracking fields to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelled_by text,
ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- Create index for better performance when filtering cancelled jobs
CREATE INDEX IF NOT EXISTS idx_jobs_cancelled_at ON public.jobs(cancelled_at);

-- Create trigger to automatically set cancelled_at and cancelled_by when job is cancelled
CREATE OR REPLACE FUNCTION public.handle_job_cancellation()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- When status changes to cancelled, set cancellation timestamp and user
  IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
    NEW.cancelled_at = now();
    -- Note: We'll set cancelled_by from the application since we're using Clerk for auth
  END IF;
  
  -- When status changes from cancelled to something else, clear cancellation fields
  IF NEW.status != 'cancelled' AND OLD.status = 'cancelled' THEN
    NEW.cancelled_at = NULL;
    NEW.cancelled_by = NULL;
    NEW.cancellation_reason = NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_handle_job_cancellation ON public.jobs;
CREATE TRIGGER trigger_handle_job_cancellation
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_job_cancellation();