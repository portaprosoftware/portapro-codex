-- Add the get_maintenance_kpis function that was missing
CREATE OR REPLACE FUNCTION public.get_maintenance_kpis()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  past_due_count INTEGER;
  due_this_week_count INTEGER;
  in_progress_count INTEGER;
  ytd_spend NUMERIC;
  result jsonb;
BEGIN
  -- Count past due maintenance
  SELECT COUNT(*) INTO past_due_count
  FROM public.maintenance_records
  WHERE scheduled_date < CURRENT_DATE
    AND status IN ('scheduled', 'in_progress');
  
  -- Count due this week
  SELECT COUNT(*) INTO due_this_week_count
  FROM public.maintenance_records
  WHERE scheduled_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')
    AND status = 'scheduled';
  
  -- Count in progress
  SELECT COUNT(*) INTO in_progress_count
  FROM public.maintenance_records
  WHERE status = 'in_progress';
  
  -- Calculate YTD spend
  SELECT COALESCE(SUM(total_cost), 0) INTO ytd_spend
  FROM public.maintenance_records
  WHERE EXTRACT(YEAR FROM completed_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND status = 'completed';
  
  result := jsonb_build_object(
    'past_due', past_due_count,
    'due_this_week', due_this_week_count,
    'in_progress', in_progress_count,
    'ytd_spend', ytd_spend
  );
  
  RETURN result;
END;
$$;