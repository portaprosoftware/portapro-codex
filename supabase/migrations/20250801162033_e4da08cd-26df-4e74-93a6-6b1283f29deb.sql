-- Fix the update_segment_counts function to include proper WHERE clause
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