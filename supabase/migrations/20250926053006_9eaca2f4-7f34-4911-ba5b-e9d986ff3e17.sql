-- Fix the get_overdue_spill_kit_checks function
DROP FUNCTION IF EXISTS public.get_overdue_spill_kit_checks();

CREATE OR REPLACE FUNCTION public.get_overdue_spill_kit_checks()
RETURNS TABLE(
  vehicle_id uuid,
  license_plate text,
  last_check_date date,
  days_overdue integer,
  compliance_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id as vehicle_id,
    v.license_plate,
    vskc.checked_at::date as last_check_date,
    CASE 
      WHEN vskc.checked_at IS NULL THEN 999
      ELSE EXTRACT(DAY FROM (NOW() - vskc.checked_at::timestamp))::integer
    END as days_overdue,
    CASE 
      WHEN vskc.checked_at IS NULL THEN 'never_checked'
      WHEN EXTRACT(DAY FROM (NOW() - vskc.checked_at::timestamp)) > 30 THEN 'overdue'
      ELSE 'current'
    END as compliance_status
  FROM public.vehicles v
  LEFT JOIN (
    SELECT DISTINCT ON (vehicle_id) 
      vehicle_id, 
      checked_at
    FROM public.vehicle_spill_kit_checks 
    ORDER BY vehicle_id, checked_at DESC
  ) vskc ON v.id = vskc.vehicle_id
  WHERE v.status = 'active'
    AND (
      vskc.checked_at IS NULL 
      OR EXTRACT(DAY FROM (NOW() - vskc.checked_at::timestamp)) > 30
    )
  ORDER BY days_overdue DESC;
END;
$$;

-- Create spill kit notification preferences table
CREATE TABLE IF NOT EXISTS public.spill_kit_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_notifications boolean NOT NULL DEFAULT true,
  sms_notifications boolean NOT NULL DEFAULT false,
  email_recipients text[] NOT NULL DEFAULT '{}',
  sms_recipients text[] NOT NULL DEFAULT '{}',
  overdue_threshold_days integer NOT NULL DEFAULT 30,
  reminder_advance_days integer NOT NULL DEFAULT 7,
  notification_frequency text NOT NULL DEFAULT 'daily',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create spill kit compliance alerts table
CREATE TABLE IF NOT EXISTS public.spill_kit_compliance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  alert_level text NOT NULL DEFAULT 'warning',
  message text NOT NULL,
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_by text,
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone
);

-- Create spill kit inventory restock requests table
CREATE TABLE IF NOT EXISTS public.spill_kit_restock_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.spill_kit_templates(id),
  missing_items jsonb NOT NULL DEFAULT '[]',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  estimated_cost numeric(10,2),
  notes text,
  requested_by text,
  assigned_to text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create function to generate restock requests automatically
CREATE OR REPLACE FUNCTION public.generate_spill_kit_restock_request(
  p_vehicle_id uuid,
  p_missing_items jsonb,
  p_template_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id uuid;
  total_cost numeric := 0;
  item jsonb;
BEGIN
  -- Calculate estimated cost from spill kit inventory
  FOR item IN SELECT * FROM jsonb_array_elements(p_missing_items)
  LOOP
    SELECT total_cost + COALESCE(ski.estimated_unit_cost * (item->>'quantity')::integer, 0)
    INTO total_cost
    FROM public.spill_kit_inventory ski
    WHERE ski.item_name = item->>'name';
  END LOOP;

  -- Create restock request
  INSERT INTO public.spill_kit_restock_requests (
    vehicle_id,
    template_id,
    missing_items,
    estimated_cost,
    notes
  ) VALUES (
    p_vehicle_id,
    p_template_id,
    p_missing_items,
    total_cost,
    'Auto-generated from spill kit inspection'
  ) RETURNING id INTO request_id;

  RETURN request_id;
END;
$$;

-- Create comprehensive reporting function
CREATE OR REPLACE FUNCTION public.generate_spill_kit_compliance_report(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_vehicle_ids uuid[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  report_data jsonb;
  total_vehicles integer;
  compliant_vehicles integer;
  overdue_vehicles integer;
  never_checked integer;
  compliance_rate numeric;
BEGIN
  -- Set default date range if not provided
  p_start_date := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  p_end_date := COALESCE(p_end_date, CURRENT_DATE);

  -- Get basic statistics
  SELECT COUNT(*) INTO total_vehicles
  FROM public.vehicles v
  WHERE (p_vehicle_ids IS NULL OR v.id = ANY(p_vehicle_ids))
    AND v.status = 'active';

  SELECT COUNT(*) INTO compliant_vehicles
  FROM public.vehicles v
  INNER JOIN public.vehicle_spill_kit_checks vskc ON v.id = vskc.vehicle_id
  WHERE (p_vehicle_ids IS NULL OR v.id = ANY(p_vehicle_ids))
    AND v.status = 'active'
    AND vskc.checked_at >= (CURRENT_DATE - INTERVAL '30 days')
    AND vskc.has_kit = true;

  SELECT COUNT(*) INTO overdue_vehicles
  FROM public.get_overdue_spill_kit_checks() overdue
  WHERE (p_vehicle_ids IS NULL OR overdue.vehicle_id = ANY(p_vehicle_ids))
    AND overdue.compliance_status = 'overdue';

  SELECT COUNT(*) INTO never_checked
  FROM public.get_overdue_spill_kit_checks() overdue
  WHERE (p_vehicle_ids IS NULL OR overdue.vehicle_id = ANY(p_vehicle_ids))
    AND overdue.compliance_status = 'never_checked';

  compliance_rate := CASE 
    WHEN total_vehicles > 0 THEN (compliant_vehicles::numeric / total_vehicles::numeric) * 100 
    ELSE 0 
  END;

  -- Build comprehensive report
  report_data := jsonb_build_object(
    'report_generated_at', now(),
    'report_period', jsonb_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date
    ),
    'summary', jsonb_build_object(
      'total_vehicles', total_vehicles,
      'compliant_vehicles', compliant_vehicles,
      'overdue_vehicles', overdue_vehicles,
      'never_checked', never_checked,
      'compliance_rate', compliance_rate
    ),
    'vehicle_details', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'vehicle_id', v.id,
          'license_plate', v.license_plate,
          'last_check_date', latest_check.checked_at,
          'has_kit', latest_check.has_kit,
          'compliance_status', 
            CASE 
              WHEN latest_check.checked_at IS NULL THEN 'never_checked'
              WHEN latest_check.checked_at < (CURRENT_DATE - INTERVAL '30 days') THEN 'overdue'
              WHEN latest_check.has_kit = false THEN 'non_compliant'
              ELSE 'compliant'
            END,
          'missing_items', COALESCE(latest_check.missing_items, '[]'::jsonb)
        )
      )
      FROM public.vehicles v
      LEFT JOIN (
        SELECT DISTINCT ON (vehicle_id)
          vehicle_id,
          checked_at,
          has_kit,
          missing_items
        FROM public.vehicle_spill_kit_checks
        ORDER BY vehicle_id, checked_at DESC
      ) latest_check ON v.id = latest_check.vehicle_id
      WHERE (p_vehicle_ids IS NULL OR v.id = ANY(p_vehicle_ids))
        AND v.status = 'active'
    )
  );

  RETURN report_data;
END;
$$;