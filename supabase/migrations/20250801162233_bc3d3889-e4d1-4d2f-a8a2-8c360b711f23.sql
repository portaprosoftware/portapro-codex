-- Drop function and dependent triggers, then recreate with proper WHERE clause
DROP FUNCTION IF EXISTS public.update_segment_counts() CASCADE;

-- Recreate the function with proper WHERE clause
CREATE OR REPLACE FUNCTION public.update_segment_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update customer segments with proper WHERE clause
  UPDATE public.customer_segments 
  SET customer_count = public.calculate_segment_customer_count(id),
      updated_at = now()
  WHERE is_active = true; -- Only update active segments
END;
$$;

-- Recreate the triggers
CREATE OR REPLACE TRIGGER update_segment_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.customers
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.update_segment_counts();

CREATE OR REPLACE TRIGGER update_segment_counts_jobs_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.jobs
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.update_segment_counts();