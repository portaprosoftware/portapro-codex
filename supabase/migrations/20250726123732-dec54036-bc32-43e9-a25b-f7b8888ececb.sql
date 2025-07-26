-- Enhanced database integration functions for Services Hub

-- Function to get comprehensive service analytics
CREATE OR REPLACE FUNCTION public.get_service_analytics(
  start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_reports integer;
  completed_reports integer;
  avg_completion_time numeric;
  top_services jsonb;
  status_breakdown jsonb;
BEGIN
  -- Get total and completed reports
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_reports, completed_reports
  FROM public.maintenance_reports
  WHERE created_at::date BETWEEN start_date AND end_date;

  -- Calculate average completion time for completed reports
  SELECT AVG(
    EXTRACT(EPOCH FROM (actual_completion - created_at)) / 3600
  ) INTO avg_completion_time
  FROM public.maintenance_reports
  WHERE status = 'completed' 
    AND actual_completion IS NOT NULL
    AND created_at::date BETWEEN start_date AND end_date;

  -- Get top services by usage
  SELECT jsonb_agg(
    jsonb_build_object(
      'service_name', rms.name,
      'service_code', rms.service_code,
      'usage_count', usage_counts.count,
      'total_revenue', usage_counts.revenue
    ) ORDER BY usage_counts.count DESC
  ) INTO top_services
  FROM (
    SELECT 
      (report_data->>'service_type') as service_name,
      COUNT(*) as count,
      SUM(COALESCE((report_data->>'total_cost')::numeric, 0)) as revenue
    FROM public.maintenance_reports
    WHERE created_at::date BETWEEN start_date AND end_date
      AND report_data->>'service_type' IS NOT NULL
    GROUP BY (report_data->>'service_type')
    ORDER BY count DESC
    LIMIT 10
  ) usage_counts
  LEFT JOIN public.routine_maintenance_services rms ON rms.name = usage_counts.service_name;

  -- Get status breakdown
  SELECT jsonb_object_agg(status, count) INTO status_breakdown
  FROM (
    SELECT status, COUNT(*) as count
    FROM public.maintenance_reports
    WHERE created_at::date BETWEEN start_date AND end_date
    GROUP BY status
  ) status_counts;

  -- Build final result
  result := jsonb_build_object(
    'period_start', start_date,
    'period_end', end_date,
    'summary', jsonb_build_object(
      'total_reports', total_reports,
      'completed_reports', completed_reports,
      'completion_rate', CASE 
        WHEN total_reports > 0 THEN ROUND((completed_reports::numeric / total_reports) * 100, 2)
        ELSE 0 
      END,
      'avg_completion_hours', ROUND(COALESCE(avg_completion_time, 0), 2)
    ),
    'top_services', COALESCE(top_services, '[]'::jsonb),
    'status_breakdown', COALESCE(status_breakdown, '{}'::jsonb)
  );

  RETURN result;
END;
$$;

-- Function to search service records with advanced filters
CREATE OR REPLACE FUNCTION public.search_service_records(
  search_term text DEFAULT '',
  status_filter text DEFAULT 'all',
  start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date date DEFAULT CURRENT_DATE,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  report_number text,
  status text,
  completion_percentage integer,
  created_at timestamp with time zone,
  customer_name text,
  service_type text,
  location text,
  assigned_technician_name text,
  priority_level text,
  estimated_completion timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.id,
    mr.report_number,
    mr.status,
    mr.completion_percentage,
    mr.created_at,
    COALESCE((mr.report_data->>'customer_name')::text, c.name) as customer_name,
    COALESCE((mr.report_data->>'service_type')::text, 'General Service') as service_type,
    COALESCE((mr.report_data->>'location')::text, 'Unknown Location') as location,
    COALESCE(p.first_name || ' ' || p.last_name, 'Unassigned') as assigned_technician_name,
    mr.priority_level,
    mr.estimated_completion
  FROM public.maintenance_reports mr
  LEFT JOIN public.customers c ON c.id = mr.customer_id
  LEFT JOIN public.profiles p ON p.id = mr.assigned_technician
  WHERE 
    mr.created_at::date BETWEEN start_date AND end_date
    AND (status_filter = 'all' OR mr.status = status_filter)
    AND (
      search_term = '' OR
      mr.report_number ILIKE '%' || search_term || '%' OR
      COALESCE((mr.report_data->>'customer_name')::text, c.name) ILIKE '%' || search_term || '%' OR
      COALESCE((mr.report_data->>'service_type')::text, '') ILIKE '%' || search_term || '%' OR
      COALESCE((mr.report_data->>'location')::text, '') ILIKE '%' || search_term || '%'
    )
  ORDER BY mr.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Function for bulk status updates
CREATE OR REPLACE FUNCTION public.bulk_update_service_status(
  record_ids uuid[],
  new_status text,
  updated_by_user uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
  failed_updates text[] := '{}';
  record_id uuid;
BEGIN
  updated_count := 0;
  
  -- Loop through each record ID
  FOREACH record_id IN ARRAY record_ids
  LOOP
    BEGIN
      UPDATE public.maintenance_reports 
      SET 
        status = new_status,
        updated_at = now(),
        completed_by = CASE WHEN new_status = 'completed' THEN updated_by_user ELSE completed_by END,
        completed_at = CASE WHEN new_status = 'completed' THEN now() ELSE completed_at END,
        completion_percentage = CASE WHEN new_status = 'completed' THEN 100 ELSE completion_percentage END
      WHERE id = record_id;
      
      IF FOUND THEN
        updated_count := updated_count + 1;
      ELSE
        failed_updates := failed_updates || record_id::text;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      failed_updates := failed_updates || record_id::text;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_count', updated_count,
    'total_requested', array_length(record_ids, 1),
    'failed_updates', failed_updates,
    'message', format('Updated %s of %s records', updated_count, array_length(record_ids, 1))
  );
END;
$$;