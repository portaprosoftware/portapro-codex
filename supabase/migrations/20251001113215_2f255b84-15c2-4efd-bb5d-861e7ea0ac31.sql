-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.generate_spill_kit_compliance_report(date, date, uuid[]);

-- Create function to generate spill kit compliance reports
CREATE OR REPLACE FUNCTION public.generate_spill_kit_compliance_report(
  p_start_date DATE,
  p_end_date DATE,
  p_vehicle_ids UUID[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report JSONB;
  v_total_vehicles INTEGER := 0;
  v_compliant_vehicles INTEGER := 0;
  v_overdue_vehicles INTEGER := 0;
  v_never_checked INTEGER := 0;
  v_compliance_rate NUMERIC;
  v_vehicle_details JSONB;
BEGIN
  -- Get vehicle details with their spill kit check status
  WITH vehicle_checks AS (
    SELECT 
      v.id as vehicle_id,
      v.license_plate,
      vskc.checked_at as last_check_date,
      vskc.has_kit,
      vskc.contents as kit_contents,
      ROW_NUMBER() OVER (PARTITION BY v.id ORDER BY vskc.checked_at DESC) as rn
    FROM public.vehicles v
    LEFT JOIN public.vehicle_spill_kit_checks vskc ON v.id = vskc.vehicle_id
      AND vskc.checked_at BETWEEN p_start_date AND p_end_date
    WHERE v.status = 'active'
      AND (p_vehicle_ids IS NULL OR v.id = ANY(p_vehicle_ids))
  ),
  latest_checks AS (
    SELECT 
      vehicle_id,
      license_plate,
      last_check_date,
      COALESCE(has_kit, false) as has_kit,
      kit_contents,
      CASE
        WHEN last_check_date IS NULL THEN 'never_checked'
        WHEN has_kit = false OR kit_contents IS NULL OR kit_contents = '[]'::jsonb THEN 'non_compliant'
        WHEN last_check_date < (CURRENT_DATE - INTERVAL '30 days') THEN 'overdue'
        ELSE 'compliant'
      END as compliance_status
    FROM vehicle_checks
    WHERE rn = 1
  )
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'vehicle_id', vehicle_id,
        'license_plate', license_plate,
        'last_check_date', last_check_date,
        'has_kit', has_kit,
        'compliance_status', compliance_status,
        'missing_items', COALESCE(
          jsonb_array_length(kit_contents), 
          0
        )
      )
    )
  INTO v_vehicle_details
  FROM latest_checks;

  -- Calculate summary statistics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE compliance_status = 'compliant'),
    COUNT(*) FILTER (WHERE compliance_status = 'overdue'),
    COUNT(*) FILTER (WHERE compliance_status = 'never_checked')
  INTO 
    v_total_vehicles,
    v_compliant_vehicles,
    v_overdue_vehicles,
    v_never_checked
  FROM (
    SELECT 
      CASE
        WHEN last_check_date IS NULL THEN 'never_checked'
        WHEN has_kit = false OR kit_contents IS NULL OR kit_contents = '[]'::jsonb THEN 'non_compliant'
        WHEN last_check_date < (CURRENT_DATE - INTERVAL '30 days') THEN 'overdue'
        ELSE 'compliant'
      END as compliance_status
    FROM (
      SELECT 
        v.id,
        vskc.checked_at as last_check_date,
        vskc.has_kit,
        vskc.contents as kit_contents,
        ROW_NUMBER() OVER (PARTITION BY v.id ORDER BY vskc.checked_at DESC) as rn
      FROM public.vehicles v
      LEFT JOIN public.vehicle_spill_kit_checks vskc ON v.id = vskc.vehicle_id
        AND vskc.checked_at BETWEEN p_start_date AND p_end_date
      WHERE v.status = 'active'
        AND (p_vehicle_ids IS NULL OR v.id = ANY(p_vehicle_ids))
    ) ranked
    WHERE rn = 1
  ) status_counts;

  -- Calculate compliance rate
  IF v_total_vehicles > 0 THEN
    v_compliance_rate := ROUND((v_compliant_vehicles::NUMERIC / v_total_vehicles::NUMERIC) * 100, 1);
  ELSE
    v_compliance_rate := 0;
  END IF;

  -- Build the final report
  v_report := jsonb_build_object(
    'report_generated_at', NOW(),
    'report_period', jsonb_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date
    ),
    'summary', jsonb_build_object(
      'total_vehicles', v_total_vehicles,
      'compliant_vehicles', v_compliant_vehicles,
      'overdue_vehicles', v_overdue_vehicles,
      'never_checked', v_never_checked,
      'compliance_rate', v_compliance_rate
    ),
    'vehicle_details', COALESCE(v_vehicle_details, '[]'::jsonb)
  );

  RETURN v_report;
END;
$$;