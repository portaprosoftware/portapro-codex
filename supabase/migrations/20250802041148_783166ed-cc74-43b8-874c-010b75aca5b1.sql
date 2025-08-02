-- Add was_overdue column to jobs table to track jobs that were ever overdue
ALTER TABLE public.jobs 
ADD COLUMN was_overdue boolean NOT NULL DEFAULT false;

-- Add index for performance when filtering overdue jobs
CREATE INDEX idx_jobs_was_overdue ON public.jobs(was_overdue) WHERE was_overdue = true;

-- Create function to automatically flag jobs as overdue
CREATE OR REPLACE FUNCTION public.check_and_flag_overdue_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update jobs that should be marked as overdue
  UPDATE public.jobs 
  SET was_overdue = true
  WHERE was_overdue = false 
    AND status NOT IN ('completed', 'cancelled')
    AND scheduled_date < CURRENT_DATE;
END;
$$;

-- Create trigger function to automatically flag jobs when they become overdue
CREATE OR REPLACE FUNCTION public.auto_flag_overdue_jobs()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If job is being updated and scheduled_date is in the past, flag as was_overdue
  IF NEW.scheduled_date < CURRENT_DATE 
     AND NEW.status NOT IN ('completed', 'cancelled')
     AND NEW.was_overdue = false THEN
    NEW.was_overdue = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on jobs table
CREATE TRIGGER trigger_auto_flag_overdue_jobs
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_flag_overdue_jobs();

-- Run initial check to flag existing overdue jobs
SELECT public.check_and_flag_overdue_jobs();