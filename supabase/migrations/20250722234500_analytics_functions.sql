
-- Create analytics functions for the dashboard

-- Get overall analytics overview
CREATE OR REPLACE FUNCTION public.get_analytics_overview(
  start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_jobs integer := 0;
  completed_jobs integer := 0;
  total_revenue numeric := 0;
  fleet_utilization numeric := 0;
  customer_growth numeric := 0;
  previous_customers integer := 0;
  current_customers integer := 0;
BEGIN
  -- Calculate job metrics
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'completed') as completed
  INTO total_jobs, completed_jobs
  FROM public.jobs
  WHERE scheduled_date BETWEEN start_date AND end_date;
  
  -- Calculate revenue
  SELECT COALESCE(SUM(amount), 0)
  INTO total_revenue
  FROM public.invoices
  WHERE created_at::date BETWEEN start_date AND end_date
    AND status = 'paid';
  
  -- Calculate fleet utilization (simplified)
  SELECT COALESCE(
    (COUNT(*) FILTER (WHERE assignment_date BETWEEN start_date AND end_date) * 100.0 / 
     NULLIF(COUNT(DISTINCT vehicle_id), 0)), 0
  )
  INTO fleet_utilization
  FROM public.daily_vehicle_assignments;
  
  -- Calculate customer growth
  SELECT COUNT(DISTINCT customer_id)
  INTO previous_customers
  FROM public.jobs
  WHERE scheduled_date BETWEEN (start_date - (end_date - start_date)) AND start_date;
  
  SELECT COUNT(DISTINCT customer_id)
  INTO current_customers
  FROM public.jobs
  WHERE scheduled_date BETWEEN start_date AND end_date;
  
  IF previous_customers > 0 THEN
    customer_growth := ((current_customers - previous_customers) * 100.0 / previous_customers);
  END IF;
  
  -- Build result
  result := jsonb_build_object(
    'jobs', jsonb_build_object(
      'total', total_jobs,
      'completed', completed_jobs,
      'completion_rate', CASE WHEN total_jobs > 0 THEN (completed_jobs * 100.0 / total_jobs) ELSE 0 END
    ),
    'revenue', total_revenue,
    'fleet_utilization', fleet_utilization,
    'customer_growth', customer_growth
  );
  
  RETURN result;
END;
$$;

-- Get revenue analytics
CREATE OR REPLACE FUNCTION public.get_revenue_analytics(
  start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  invoiced_amount numeric := 0;
  collected_amount numeric := 0;
  outstanding_amount numeric := 0;
  collection_rate numeric := 0;
BEGIN
  -- Calculate invoiced amount
  SELECT COALESCE(SUM(amount), 0)
  INTO invoiced_amount
  FROM public.invoices
  WHERE created_at::date BETWEEN start_date AND end_date;
  
  -- Calculate collected amount
  SELECT COALESCE(SUM(amount), 0)
  INTO collected_amount
  FROM public.invoices
  WHERE created_at::date BETWEEN start_date AND end_date
    AND status = 'paid';
  
  -- Calculate outstanding amount
  SELECT COALESCE(SUM(amount), 0)
  INTO outstanding_amount
  FROM public.invoices
  WHERE status = 'unpaid';
  
  -- Calculate collection rate
  IF invoiced_amount > 0 THEN
    collection_rate := (collected_amount * 100.0 / invoiced_amount);
  END IF;
  
  result := jsonb_build_object(
    'invoiced', invoiced_amount,
    'collected', collected_amount,
    'outstanding', outstanding_amount,
    'collection_rate', collection_rate
  );
  
  RETURN result;
END;
$$;

-- Get operations analytics
CREATE OR REPLACE FUNCTION public.get_operations_analytics(
  start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  deliveries integer := 0;
  pickups integer := 0;
  services integer := 0;
  returns integer := 0;
BEGIN
  -- Count job types
  SELECT 
    COUNT(*) FILTER (WHERE job_type = 'delivery') as delivery_count,
    COUNT(*) FILTER (WHERE job_type = 'pickup') as pickup_count,
    COUNT(*) FILTER (WHERE job_type = 'service') as service_count,
    COUNT(*) FILTER (WHERE job_type = 'return') as return_count
  INTO deliveries, pickups, services, returns
  FROM public.jobs
  WHERE scheduled_date BETWEEN start_date AND end_date;
  
  result := jsonb_build_object(
    'deliveries', deliveries,
    'pickups', pickups,
    'services', services,
    'returns', returns,
    'total', deliveries + pickups + services + returns
  );
  
  RETURN result;
END;
$$;

-- Get customer analytics
CREATE OR REPLACE FUNCTION public.get_customer_analytics(
  start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  new_customers integer := 0;
  returning_customers integer := 0;
  total_customers integer := 0;
  avg_clv numeric := 0;
BEGIN
  -- Count new customers (first job in period)
  SELECT COUNT(DISTINCT customer_id)
  INTO new_customers
  FROM public.jobs j1
  WHERE j1.scheduled_date BETWEEN start_date AND end_date
    AND NOT EXISTS (
      SELECT 1 FROM public.jobs j2 
      WHERE j2.customer_id = j1.customer_id 
        AND j2.scheduled_date < start_date
    );
  
  -- Count returning customers
  SELECT COUNT(DISTINCT customer_id)
  INTO returning_customers
  FROM public.jobs j1
  WHERE j1.scheduled_date BETWEEN start_date AND end_date
    AND EXISTS (
      SELECT 1 FROM public.jobs j2 
      WHERE j2.customer_id = j1.customer_id 
        AND j2.scheduled_date < start_date
    );
  
  total_customers := new_customers + returning_customers;
  
  -- Calculate average CLV (simplified as total revenue per customer)
  SELECT COALESCE(AVG(customer_revenue), 0)
  INTO avg_clv
  FROM (
    SELECT SUM(i.amount) as customer_revenue
    FROM public.invoices i
    WHERE i.created_at::date BETWEEN start_date AND end_date
      AND i.status = 'paid'
    GROUP BY i.customer_id
  ) customer_totals;
  
  result := jsonb_build_object(
    'new_customers', new_customers,
    'returning_customers', returning_customers,
    'total_customers', total_customers,
    'retention_rate', CASE WHEN total_customers > 0 THEN (returning_customers * 100.0 / total_customers) ELSE 0 END,
    'avg_clv', avg_clv
  );
  
  RETURN result;
END;
$$;

-- Get driver analytics
CREATE OR REPLACE FUNCTION public.get_driver_analytics(
  start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  active_drivers integer := 0;
  total_jobs integer := 0;
  completed_jobs integer := 0;
  avg_completion numeric := 0;
BEGIN
  -- Count active drivers
  SELECT COUNT(DISTINCT driver_id)
  INTO active_drivers
  FROM public.jobs
  WHERE scheduled_date BETWEEN start_date AND end_date
    AND driver_id IS NOT NULL;
  
  -- Count total and completed jobs
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'completed') as completed
  INTO total_jobs, completed_jobs
  FROM public.jobs
  WHERE scheduled_date BETWEEN start_date AND end_date
    AND driver_id IS NOT NULL;
  
  IF total_jobs > 0 THEN
    avg_completion := (completed_jobs * 100.0 / total_jobs);
  END IF;
  
  result := jsonb_build_object(
    'active_drivers', active_drivers,
    'total_jobs', total_jobs,
    'completed_jobs', completed_jobs,
    'avg_completion_rate', avg_completion
  );
  
  RETURN result;
END;
$$;
