-- SQL functions for Fleet Maintenance Module Phases 3-5 (Fixed)

-- Function to get compliance notification counts for sidebar badges
CREATE OR REPLACE FUNCTION public.get_compliance_notification_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  overdue_count INTEGER := 0;
  due_soon_count INTEGER := 0;
  inspection_due_count INTEGER := 0;
  result jsonb;
BEGIN
  -- Count overdue maintenance records
  SELECT COUNT(*)
  INTO overdue_count
  FROM public.maintenance_records
  WHERE scheduled_date < CURRENT_DATE
    AND status NOT IN ('completed', 'cancelled');
  
  -- Count maintenance due within 7 days
  SELECT COUNT(*)
  INTO due_soon_count
  FROM public.maintenance_records
  WHERE scheduled_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')
    AND status NOT IN ('completed', 'cancelled');
  
  -- Count vehicles needing inspection (mock calculation)
  SELECT COUNT(*)
  INTO inspection_due_count
  FROM public.vehicles v
  LEFT JOIN public.maintenance_records mr ON v.id = mr.vehicle_id AND mr.maintenance_type = 'inspection'
  WHERE v.status = 'active'
    AND (mr.next_service_date IS NULL OR mr.next_service_date <= CURRENT_DATE + INTERVAL '30 days');
  
  -- Build result JSON
  result := jsonb_build_object(
    'overdue_maintenance', overdue_count,
    'due_soon', due_soon_count,
    'inspections_due', inspection_due_count,
    'total_alerts', overdue_count + due_soon_count + inspection_due_count
  );
  
  RETURN result;
END;
$$;

-- Function to get enhanced maintenance metrics for analytics
CREATE OR REPLACE FUNCTION public.get_maintenance_metrics(start_date date, end_date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_cost numeric := 0;
  total_records integer := 0;
  avg_cost numeric := 0;
  preventive_percentage numeric := 0;
  downtime_hours numeric := 0;
  cost_by_type jsonb := '[]'::jsonb;
  result jsonb;
BEGIN
  -- Calculate total cost and record count
  SELECT 
    COALESCE(SUM(total_cost), 0),
    COUNT(*)
  INTO total_cost, total_records
  FROM public.maintenance_records
  WHERE completed_date BETWEEN start_date AND end_date
    AND status = 'completed';
  
  -- Calculate average cost
  IF total_records > 0 THEN
    avg_cost := total_cost / total_records;
  END IF;
  
  -- Calculate preventive vs reactive maintenance percentage
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE maintenance_type IN ('preventive', 'scheduled')) * 100.0 / COUNT(*))
      ELSE 0 
    END
  INTO preventive_percentage
  FROM public.maintenance_records
  WHERE completed_date BETWEEN start_date AND end_date
    AND status = 'completed';
  
  -- Calculate estimated downtime (mock calculation)
  SELECT COALESCE(SUM(actual_hours), 0)
  INTO downtime_hours
  FROM public.maintenance_records
  WHERE completed_date BETWEEN start_date AND end_date
    AND status = 'completed';
  
  -- Get cost breakdown by maintenance type
  SELECT jsonb_agg(
    jsonb_build_object(
      'type', maintenance_type,
      'cost', COALESCE(SUM(total_cost), 0),
      'count', COUNT(*)
    )
  )
  INTO cost_by_type
  FROM public.maintenance_records
  WHERE completed_date BETWEEN start_date AND end_date
    AND status = 'completed'
  GROUP BY maintenance_type;
  
  -- Build result JSON
  result := jsonb_build_object(
    'total_cost', total_cost,
    'total_records', total_records,
    'average_cost', avg_cost,
    'preventive_percentage', preventive_percentage,
    'downtime_hours', downtime_hours,
    'cost_by_type', COALESCE(cost_by_type, '[]'::jsonb),
    'period_start', start_date,
    'period_end', end_date
  );
  
  RETURN result;
END;
$$;

-- Function to export maintenance data as structured JSON
CREATE OR REPLACE FUNCTION public.export_maintenance_data(
  start_date date DEFAULT NULL,
  end_date date DEFAULT NULL,
  vehicle_ids uuid[] DEFAULT NULL,
  export_format text DEFAULT 'detailed'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  records_data jsonb;
  summary_data jsonb;
BEGIN
  -- Set default date range if not provided
  IF start_date IS NULL THEN
    start_date := CURRENT_DATE - INTERVAL '90 days';
  END IF;
  
  IF end_date IS NULL THEN
    end_date := CURRENT_DATE;
  END IF;
  
  -- Get maintenance records with vehicle info
  SELECT jsonb_agg(
    jsonb_build_object(
      'record_id', mr.id,
      'vehicle_info', jsonb_build_object(
        'license_plate', v.license_plate,
        'make', v.make,
        'model', v.model,
        'year', v.year
      ),
      'maintenance_type', mr.maintenance_type,
      'description', mr.description,
      'scheduled_date', mr.scheduled_date,
      'completed_date', mr.completed_date,
      'status', mr.status,
      'priority', mr.priority,
      'costs', jsonb_build_object(
        'parts_cost', mr.parts_cost,
        'labor_cost', mr.labor_cost,
        'total_cost', mr.total_cost
      ),
      'service_details', jsonb_build_object(
        'mileage_at_service', mr.mileage_at_service,
        'actual_hours', mr.actual_hours,
        'service_provider', mr.service_provider,
        'invoice_number', mr.invoice_number
      ),
      'technician_name', CASE 
        WHEN p.first_name IS NOT NULL THEN CONCAT(p.first_name, ' ', p.last_name)
        ELSE NULL
      END,
      'vendor_name', mv.name,
      'notes', mr.notes
    )
  )
  INTO records_data
  FROM public.maintenance_records mr
  LEFT JOIN public.vehicles v ON mr.vehicle_id = v.id
  LEFT JOIN public.profiles p ON mr.technician_id = p.id
  LEFT JOIN public.maintenance_vendors mv ON mr.vendor_id = mv.id
  WHERE (start_date IS NULL OR mr.completed_date >= start_date)
    AND (end_date IS NULL OR mr.completed_date <= end_date)
    AND (vehicle_ids IS NULL OR mr.vehicle_id = ANY(vehicle_ids))
  ORDER BY mr.completed_date DESC;
  
  -- Get summary data
  SELECT jsonb_build_object(
    'total_records', COUNT(*),
    'total_cost', COALESCE(SUM(mr.total_cost), 0),
    'average_cost', COALESCE(AVG(mr.total_cost), 0),
    'cost_by_type', (
      SELECT jsonb_object_agg(maintenance_type, type_cost)
      FROM (
        SELECT maintenance_type, SUM(total_cost) as type_cost
        FROM public.maintenance_records
        WHERE completed_date BETWEEN start_date AND end_date
          AND (vehicle_ids IS NULL OR vehicle_id = ANY(vehicle_ids))
        GROUP BY maintenance_type
      ) t
    )
  )
  INTO summary_data
  FROM public.maintenance_records mr
  WHERE (start_date IS NULL OR mr.completed_date >= start_date)
    AND (end_date IS NULL OR mr.completed_date <= end_date)
    AND (vehicle_ids IS NULL OR mr.vehicle_id = ANY(vehicle_ids));
  
  -- Build final result
  result := jsonb_build_object(
    'export_info', jsonb_build_object(
      'generated_at', now(),
      'date_range', jsonb_build_object(
        'start_date', start_date,
        'end_date', end_date
      ),
      'format', export_format
    ),
    'summary', COALESCE(summary_data, '{}'::jsonb),
    'records', COALESCE(records_data, '[]'::jsonb)
  );
  
  RETURN result;
END;
$$;

-- Function to get technician workload and availability
CREATE OR REPLACE FUNCTION public.get_technician_availability()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'technician_id', p.id,
      'name', CONCAT(p.first_name, ' ', p.last_name),
      'active_tasks', COALESCE(task_counts.active_count, 0),
      'scheduled_tasks', COALESCE(task_counts.scheduled_count, 0),
      'availability_status', CASE 
        WHEN COALESCE(task_counts.active_count, 0) = 0 THEN 'available'
        WHEN COALESCE(task_counts.active_count, 0) <= 2 THEN 'busy'
        ELSE 'overloaded'
      END,
      'next_available', CASE 
        WHEN COALESCE(task_counts.active_count, 0) = 0 THEN CURRENT_DATE
        ELSE CURRENT_DATE + INTERVAL '1 day'
      END
    )
  )
  INTO result
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON p.id = ur.user_id
  LEFT JOIN (
    SELECT 
      technician_id,
      COUNT(*) FILTER (WHERE status IN ('in_progress', 'assigned')) as active_count,
      COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_count
    FROM public.maintenance_records
    WHERE technician_id IS NOT NULL
      AND status NOT IN ('completed', 'cancelled')
    GROUP BY technician_id
  ) task_counts ON p.id = task_counts.technician_id
  WHERE ur.role IN ('driver', 'admin')
    AND p.is_active = true;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Create indexes for better performance (without CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_maintenance_records_scheduled_date ON public.maintenance_records(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_technician_status ON public.maintenance_records(technician_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_vehicle_type ON public.maintenance_records(vehicle_id, maintenance_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_completed_date ON public.maintenance_records(completed_date);