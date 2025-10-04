-- Create function to get comprehensive vehicle summary data
CREATE OR REPLACE FUNCTION public.get_vehicle_summary(p_vehicle_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'maintenance', json_build_object(
      'open_work_orders', (
        SELECT COUNT(*) 
        FROM public.work_orders 
        WHERE vehicle_id = p_vehicle_id 
        AND status NOT IN ('completed', 'cancelled')
      ),
      'dvirs_30d', (
        SELECT COUNT(*) 
        FROM public.vehicle_inspections 
        WHERE vehicle_id = p_vehicle_id 
        AND inspection_date > CURRENT_DATE - INTERVAL '30 days'
      ),
      'last_dvir', (
        SELECT json_build_object(
          'date', inspection_date,
          'status', inspection_status
        )
        FROM public.vehicle_inspections 
        WHERE vehicle_id = p_vehicle_id 
        ORDER BY inspection_date DESC 
        LIMIT 1
      ),
      'next_pm_due', (
        SELECT json_build_object(
          'name', pt.name,
          'due_value', vps.next_due_value,
          'trigger_type', vps.trigger_type
        )
        FROM public.vehicle_pm_schedules vps
        LEFT JOIN public.pm_templates pt ON pt.id = vps.template_id
        WHERE vps.vehicle_id = p_vehicle_id 
        AND vps.active = true 
        ORDER BY vps.next_due_date ASC 
        LIMIT 1
      )
    ),
    'fuel', json_build_object(
      'last_fill_date', (
        SELECT created_at 
        FROM public.fuel_logs 
        WHERE vehicle_id = p_vehicle_id 
        ORDER BY created_at DESC 
        LIMIT 1
      ),
      'last_fill_gallons', (
        SELECT gallons 
        FROM public.fuel_logs 
        WHERE vehicle_id = p_vehicle_id 
        ORDER BY created_at DESC 
        LIMIT 1
      ),
      'avg_mpg_30d', (
        SELECT ROUND(AVG(mpg)::numeric, 2) 
        FROM public.fuel_logs 
        WHERE vehicle_id = p_vehicle_id 
        AND created_at > CURRENT_DATE - INTERVAL '30 days'
      ),
      'total_spent_30d', (
        SELECT COALESCE(SUM(total_cost), 0) 
        FROM public.fuel_logs 
        WHERE vehicle_id = p_vehicle_id 
        AND created_at > CURRENT_DATE - INTERVAL '30 days'
      )
    ),
    'compliance', json_build_object(
      'spill_kit_status', (
        SELECT CASE 
          WHEN EXISTS(
            SELECT 1 
            FROM public.vehicle_spill_kits 
            WHERE vehicle_id = p_vehicle_id 
            AND active = true
          ) THEN 'compliant' 
          ELSE 'missing' 
        END
      ),
      'last_kit_check', (
        SELECT MAX(created_at) 
        FROM public.vehicle_spill_kit_checks 
        WHERE vehicle_id = p_vehicle_id
        AND deleted_at IS NULL
      ),
      'incidents_30d', (
        SELECT COUNT(*) 
        FROM public.vehicle_incidents 
        WHERE vehicle_id = p_vehicle_id 
        AND incident_date > CURRENT_DATE - INTERVAL '30 days'
      ),
      'decon_logs_30d', (
        SELECT COUNT(*) 
        FROM public.decon_logs 
        WHERE vehicle_id = p_vehicle_id 
        AND performed_at > CURRENT_DATE - INTERVAL '30 days'
      )
    ),
    'documents', json_build_object(
      'total_count', (
        SELECT COUNT(*) 
        FROM public.compliance_documents 
        WHERE vehicle_id = p_vehicle_id
      ),
      'expiring_soon', (
        SELECT COUNT(*) 
        FROM public.compliance_documents 
        WHERE vehicle_id = p_vehicle_id 
        AND expiration_date IS NOT NULL
        AND expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      )
    ),
    'stock', json_build_object(
      'todays_load', (
        SELECT COALESCE(SUM(assigned_quantity), 0) 
        FROM public.daily_vehicle_loads 
        WHERE vehicle_id = p_vehicle_id 
        AND load_date = CURRENT_DATE
      )
    ),
    'assignments', json_build_object(
      'active_count', (
        SELECT COUNT(*) 
        FROM public.daily_vehicle_assignments 
        WHERE vehicle_id = p_vehicle_id 
        AND assignment_date >= CURRENT_DATE
      ),
      'upcoming_jobs', (
        SELECT COUNT(*) 
        FROM public.jobs j
        LEFT JOIN public.vehicle_assignments va ON va.job_id = j.id
        WHERE va.vehicle_id = p_vehicle_id 
        AND j.scheduled_date >= CURRENT_DATE
        AND j.status NOT IN ('completed', 'cancelled')
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$$;