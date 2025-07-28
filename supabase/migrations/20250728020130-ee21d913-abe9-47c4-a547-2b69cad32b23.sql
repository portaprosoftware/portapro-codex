-- Create functions to calculate customer analytics for smart segments

-- Function to calculate customer total spent
CREATE OR REPLACE FUNCTION public.calculate_customer_total_spent(customer_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  total_spent numeric := 0;
BEGIN
  SELECT COALESCE(SUM(j.total_price), 0)
  INTO total_spent
  FROM public.jobs j
  WHERE j.customer_id = customer_uuid
    AND j.status = 'completed';
  
  RETURN total_spent;
END;
$function$;

-- Function to calculate customer job count
CREATE OR REPLACE FUNCTION public.calculate_customer_job_count(customer_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  job_count integer := 0;
BEGIN
  SELECT COUNT(*)
  INTO job_count
  FROM public.jobs j
  WHERE j.customer_id = customer_uuid;
  
  RETURN job_count;
END;
$function$;

-- Function to get customer last job date
CREATE OR REPLACE FUNCTION public.get_customer_last_job_date(customer_uuid uuid)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  last_job_date date;
BEGIN
  SELECT MAX(j.scheduled_date)
  INTO last_job_date
  FROM public.jobs j
  WHERE j.customer_id = customer_uuid;
  
  RETURN last_job_date;
END;
$function$;

-- Function to calculate smart segment size
CREATE OR REPLACE FUNCTION public.calculate_smart_segment_size(segment_type text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  segment_count integer := 0;
BEGIN
  CASE segment_type
    WHEN 'new_customers' THEN
      SELECT COUNT(*)
      INTO segment_count
      FROM public.customers c
      WHERE c.created_at >= CURRENT_DATE - INTERVAL '30 days';
      
    WHEN 'active_customers' THEN
      SELECT COUNT(*)
      INTO segment_count
      FROM public.customers c
      WHERE EXISTS (
        SELECT 1 FROM public.jobs j 
        WHERE j.customer_id = c.id 
          AND j.scheduled_date >= CURRENT_DATE - INTERVAL '60 days'
      );
      
    WHEN 'lapsed_customers' THEN
      SELECT COUNT(*)
      INTO segment_count
      FROM public.customers c
      WHERE EXISTS (
        SELECT 1 FROM public.jobs j 
        WHERE j.customer_id = c.id 
          AND j.scheduled_date <= CURRENT_DATE - INTERVAL '90 days'
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.jobs j2 
        WHERE j2.customer_id = c.id 
          AND j2.scheduled_date > CURRENT_DATE - INTERVAL '90 days'
      );
      
    WHEN 'big_spenders' THEN
      SELECT COUNT(*)
      INTO segment_count
      FROM public.customers c
      WHERE public.calculate_customer_total_spent(c.id) >= 5000;
      
    WHEN 'frequent_users' THEN
      SELECT COUNT(*)
      INTO segment_count
      FROM public.customers c
      WHERE public.calculate_customer_job_count(c.id) >= 10;
      
    WHEN 'email_only_contacts' THEN
      SELECT COUNT(*)
      INTO segment_count
      FROM public.customers c
      WHERE c.email IS NOT NULL 
        AND c.email != ''
        AND (c.phone IS NULL OR c.phone = '');
        
    WHEN 'sms_ready' THEN
      SELECT COUNT(*)
      INTO segment_count
      FROM public.customers c
      WHERE c.phone IS NOT NULL 
        AND c.phone != '';
        
    WHEN 'high_priority_accounts' THEN
      -- Top 10% by total spent
      SELECT COUNT(*)
      INTO segment_count
      FROM (
        SELECT c.id
        FROM public.customers c
        ORDER BY public.calculate_customer_total_spent(c.id) DESC
        LIMIT (SELECT CEIL(COUNT(*) * 0.1) FROM public.customers)
      ) top_customers;
      
    ELSE
      segment_count := 0;
  END CASE;
  
  RETURN segment_count;
END;
$function$;