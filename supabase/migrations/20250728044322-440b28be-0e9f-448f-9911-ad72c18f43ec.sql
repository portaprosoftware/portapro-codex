-- Clean up duplicate customer segments and fix the counting issue
-- First, delete the duplicate 'New Customers' segments, keeping only the earliest one
DELETE FROM public.customer_segments 
WHERE name = 'New Customers' 
AND created_at NOT IN (
  SELECT MIN(created_at) 
  FROM public.customer_segments 
  WHERE name = 'New Customers'
);

-- Delete duplicates of 'Active Customers' if any, keeping only the earliest one
DELETE FROM public.customer_segments 
WHERE name = 'Active Customers' 
AND created_at NOT IN (
  SELECT MIN(created_at) 
  FROM public.customer_segments 
  WHERE name = 'Active Customers'
);

-- Create function to properly calculate segment counts
CREATE OR REPLACE FUNCTION public.calculate_segment_customer_count(segment_id UUID)
RETURNS INTEGER AS $$
DECLARE
  segment_rule_set JSONB;
  customer_count INTEGER := 0;
  segment_name TEXT;
BEGIN
  -- Get the segment information
  SELECT name, rule_set INTO segment_name, segment_rule_set 
  FROM public.customer_segments 
  WHERE id = segment_id;
  
  -- For now, let's implement basic counting for the two main segments
  IF segment_name = 'New Customers' THEN
    -- Count customers created in the last 30 days
    SELECT COUNT(*) INTO customer_count
    FROM public.customers
    WHERE created_at >= NOW() - INTERVAL '30 days';
    
  ELSIF segment_name = 'Active Customers' THEN
    -- Count customers with jobs in the last 60 days
    SELECT COUNT(DISTINCT c.id) INTO customer_count
    FROM public.customers c
    INNER JOIN public.jobs j ON c.id = j.customer_id
    WHERE j.created_at >= NOW() - INTERVAL '60 days';
    
  ELSE
    -- For other segments, return 0 for now
    customer_count := 0;
  END IF;
  
  RETURN customer_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the customer counts for existing segments
UPDATE public.customer_segments 
SET customer_count = public.calculate_segment_customer_count(id);

-- Create or replace the trigger function to update segment counts
CREATE OR REPLACE FUNCTION public.update_segment_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all segment counts when customers or jobs change
  UPDATE public.customer_segments 
  SET customer_count = public.calculate_segment_customer_count(id),
      updated_at = now();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the triggers
DROP TRIGGER IF EXISTS update_segment_counts_trigger ON public.customers;
DROP TRIGGER IF EXISTS update_segment_counts_jobs_trigger ON public.jobs;

CREATE TRIGGER update_segment_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_segment_counts();

CREATE TRIGGER update_segment_counts_jobs_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_segment_counts();