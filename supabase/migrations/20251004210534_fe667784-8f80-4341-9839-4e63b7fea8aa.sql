-- Fix get_vehicle_summary RPC function with correct column names
-- Drop the existing function first
DROP FUNCTION IF EXISTS get_vehicle_summary(UUID);

-- Create the corrected function
CREATE OR REPLACE FUNCTION get_vehicle_summary(p_vehicle_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  last_dvir_record RECORD;
  next_pm_record RECORD;
BEGIN
  -- Get last DVIR info (using asset_id, not vehicle_id)
  SELECT status, created_at INTO last_dvir_record
  FROM dvir_reports
  WHERE asset_id = p_vehicle_id
    AND asset_type = 'vehicle'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get next PM due
  SELECT name, next_due_value, trigger_type INTO next_pm_record
  FROM vehicle_pm_schedules
  WHERE vehicle_id = p_vehicle_id 
    AND active = true
  ORDER BY next_due_date ASC NULLS LAST
  LIMIT 1;

  -- Build comprehensive summary object
  SELECT json_build_object(
    'maintenance', json_build_object(
      'open_work_orders', (
        SELECT COUNT(*)
        FROM work_orders
        WHERE asset_id = p_vehicle_id
          AND asset_type = 'vehicle'
          AND status IN ('open', 'in_progress', 'pending')
      ),
      'dvirs_30d', (
        SELECT COUNT(*)
        FROM dvir_reports
        WHERE asset_id = p_vehicle_id
          AND asset_type = 'vehicle'
          AND created_at > NOW() - INTERVAL '30 days'
      ),
      'next_pm_due', CASE
        WHEN next_pm_record.name IS NOT NULL THEN
          json_build_object(
            'name', next_pm_record.name,
            'due_value', next_pm_record.next_due_value,
            'trigger_type', next_pm_record.trigger_type
          )
        ELSE NULL
      END,
      'last_dvir', CASE
        WHEN last_dvir_record.status IS NOT NULL THEN
          json_build_object(
            'status', last_dvir_record.status,
            'date', last_dvir_record.created_at
          )
        ELSE NULL
      END
    ),
    'fuel', json_build_object(
      'last_fill_date', (
        SELECT created_at
        FROM fuel_logs
        WHERE vehicle_id = p_vehicle_id
        ORDER BY created_at DESC
        LIMIT 1
      ),
      'last_fill_gallons', (
        SELECT gallons
        FROM fuel_logs
        WHERE vehicle_id = p_vehicle_id
        ORDER BY created_at DESC
        LIMIT 1
      ),
      'avg_mpg_30d', (
        SELECT ROUND(AVG(mpg)::numeric, 2)
        FROM fuel_logs
        WHERE vehicle_id = p_vehicle_id
          AND created_at > NOW() - INTERVAL '30 days'
          AND mpg IS NOT NULL
      ),
      'total_spent_30d', (
        SELECT COALESCE(SUM(total_cost), 0)
        FROM fuel_logs
        WHERE vehicle_id = p_vehicle_id
          AND created_at > NOW() - INTERVAL '30 days'
      )
    ),
    'compliance', json_build_object(
      'spill_kit_status', (
        SELECT CASE
          WHEN EXISTS(
            SELECT 1
            FROM vehicle_spill_kits
            WHERE vehicle_id = p_vehicle_id AND active = true
          ) THEN 'compliant'
          ELSE 'missing'
        END
      ),
      'last_kit_check', (
        SELECT MAX(updated_at)
        FROM vehicle_spill_kits
        WHERE vehicle_id = p_vehicle_id
      ),
      'incidents_30d', (
        SELECT COUNT(*)
        FROM spill_incident_reports
        WHERE vehicle_id = p_vehicle_id
          AND incident_datetime > NOW() - INTERVAL '30 days'
      ),
      'decon_logs_30d', (
        SELECT COUNT(*)
        FROM decon_logs
        WHERE vehicle_id = p_vehicle_id
          AND performed_at > NOW() - INTERVAL '30 days'
      )
    ),
    'documents', json_build_object(
      'total_count', (
        SELECT COUNT(*)
        FROM compliance_documents
        WHERE asset_id = p_vehicle_id
      ),
      'expiring_soon', (
        SELECT COUNT(*)
        FROM compliance_documents
        WHERE asset_id = p_vehicle_id
          AND expiration_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
      )
    ),
    'stock', json_build_object(
      'todays_load', (
        SELECT COALESCE(SUM(assigned_quantity), 0)
        FROM daily_vehicle_loads
        WHERE vehicle_id = p_vehicle_id
          AND load_date = CURRENT_DATE
      )
    ),
    'assignments', json_build_object(
      'active_count', (
        SELECT COUNT(*)
        FROM equipment_assignments
        WHERE product_item_id IN (
          SELECT id FROM product_items WHERE status = 'assigned'
        )
      ),
      'upcoming_jobs', (
        SELECT COUNT(DISTINCT j.id)
        FROM jobs j
        INNER JOIN vehicle_assignments va ON va.job_id = j.id
        WHERE va.vehicle_id = p_vehicle_id
          AND j.scheduled_date >= CURRENT_DATE
          AND j.status NOT IN ('completed', 'cancelled')
      )
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;