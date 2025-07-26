-- Phase 3: Enhanced SQL functions and triggers for in-house features

-- Create maintenance notification schedules table
CREATE TABLE IF NOT EXISTS public.maintenance_notification_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_record_id UUID NOT NULL REFERENCES public.maintenance_records(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('7_day_reminder', 'day_of_reminder', 'mileage_reminder', 'overdue_reminder')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance parts assignments table for tracking parts used in specific maintenance
CREATE TABLE IF NOT EXISTS public.maintenance_parts_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_record_id UUID NOT NULL REFERENCES public.maintenance_records(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.maintenance_parts(id),
  quantity_used INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC(10,2),
  total_cost NUMERIC(10,2),
  assigned_by UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Create daily vehicle assignments table for mileage tracking
CREATE TABLE IF NOT EXISTS public.daily_vehicle_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  driver_id UUID REFERENCES public.profiles(id),
  assignment_date DATE NOT NULL,
  start_mileage INTEGER,
  end_mileage INTEGER,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(vehicle_id, assignment_date)
);

-- Enable RLS on new tables
ALTER TABLE public.maintenance_notification_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_parts_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_vehicle_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public access to maintenance notification schedules" ON public.maintenance_notification_schedules FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access to maintenance parts assignments" ON public.maintenance_parts_assignments FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access to daily vehicle assignments" ON public.daily_vehicle_assignments FOR ALL TO public USING (true) WITH CHECK (true);

-- Create updated_at triggers
CREATE TRIGGER update_maintenance_notification_schedules_updated_at
  BEFORE UPDATE ON public.maintenance_notification_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_parts_assignments_updated_at
  BEFORE UPDATE ON public.maintenance_parts_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_vehicle_assignments_updated_at
  BEFORE UPDATE ON public.daily_vehicle_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get maintenance KPIs (enhanced version)
CREATE OR REPLACE FUNCTION public.get_maintenance_kpis()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  past_due_count INTEGER;
  due_this_week_count INTEGER;
  in_progress_count INTEGER;
  ytd_spend NUMERIC;
  avg_cost_per_service NUMERIC;
  total_services_ytd INTEGER;
BEGIN
  -- Count past due maintenance
  SELECT COUNT(*)
  INTO past_due_count
  FROM public.maintenance_records
  WHERE scheduled_date < CURRENT_DATE
    AND status IN ('scheduled', 'in_progress');

  -- Count due this week
  SELECT COUNT(*)
  INTO due_this_week_count
  FROM public.maintenance_records
  WHERE scheduled_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')
    AND status = 'scheduled';

  -- Count in progress
  SELECT COUNT(*)
  INTO in_progress_count
  FROM public.maintenance_records
  WHERE status = 'in_progress';

  -- Calculate YTD spend
  SELECT COALESCE(SUM(total_cost), 0)
  INTO ytd_spend
  FROM public.maintenance_records
  WHERE EXTRACT(YEAR FROM completed_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND status = 'completed';

  -- Calculate average cost and total services
  SELECT 
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN ytd_spend / COUNT(*) ELSE 0 END
  INTO total_services_ytd, avg_cost_per_service
  FROM public.maintenance_records
  WHERE EXTRACT(YEAR FROM completed_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND status = 'completed';

  RETURN json_build_object(
    'past_due', past_due_count,
    'due_this_week', due_this_week_count,
    'in_progress', in_progress_count,
    'ytd_spend', ytd_spend,
    'avg_cost_per_service', avg_cost_per_service,
    'total_services_ytd', total_services_ytd
  );
END;
$$;

-- Create function to get available technicians
CREATE OR REPLACE FUNCTION public.get_available_technicians(maintenance_date DATE)
RETURNS TABLE(
  technician_id UUID,
  first_name TEXT,
  last_name TEXT,
  specialties TEXT[],
  hourly_rate NUMERIC,
  workload_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mt.id,
    mt.first_name,
    mt.last_name,
    mt.specialties,
    mt.hourly_rate,
    COUNT(mr.id) as workload_count
  FROM public.maintenance_technicians mt
  LEFT JOIN public.maintenance_records mr ON mr.technician_id = mt.id 
    AND mr.scheduled_date = maintenance_date
    AND mr.status IN ('scheduled', 'in_progress')
  WHERE mt.is_active = true
  GROUP BY mt.id, mt.first_name, mt.last_name, mt.specialties, mt.hourly_rate
  ORDER BY workload_count ASC, mt.first_name ASC;
END;
$$;

-- Create function to schedule maintenance notifications
CREATE OR REPLACE FUNCTION public.schedule_maintenance_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_mileage INTEGER;
  avg_daily_mileage NUMERIC;
  days_to_target INTEGER;
  estimated_mileage_date DATE;
BEGIN
  -- Only schedule notifications if record is not completed/cancelled
  IF NEW.status NOT IN ('completed', 'cancelled') THEN
    
    -- Delete existing notification schedules for this maintenance record
    DELETE FROM public.maintenance_notification_schedules 
    WHERE maintenance_record_id = NEW.id;
    
    -- Handle date-based or both scheduling
    IF NEW.notification_trigger_type IN ('date_based', 'both') AND NEW.scheduled_date IS NOT NULL THEN
      
      -- Schedule 7-day reminder (only if more than 7 days away)
      IF NEW.scheduled_date > CURRENT_DATE + INTERVAL '7 days' THEN
        INSERT INTO public.maintenance_notification_schedules (
          maintenance_record_id,
          notification_type,
          scheduled_for
        ) VALUES (
          NEW.id,
          '7_day_reminder',
          (NEW.scheduled_date - INTERVAL '7 days')::timestamp with time zone
        );
      END IF;
      
      -- Schedule day-of reminder
      INSERT INTO public.maintenance_notification_schedules (
        maintenance_record_id,
        notification_type,
        scheduled_for
      ) VALUES (
        NEW.id,
        'day_of_reminder',
        NEW.scheduled_date::timestamp with time zone + INTERVAL '8 hours' -- 8 AM on the day
      );
    END IF;
    
    -- Handle mileage-based or both scheduling
    IF NEW.notification_trigger_type IN ('mileage_based', 'both') AND NEW.next_service_mileage IS NOT NULL THEN
      
      -- Get current vehicle mileage from latest daily assignment
      SELECT COALESCE(MAX(end_mileage), MAX(start_mileage), 0)
      INTO current_mileage
      FROM public.daily_vehicle_assignments 
      WHERE vehicle_id = NEW.vehicle_id 
      AND assignment_date >= CURRENT_DATE - INTERVAL '30 days';
      
      -- Calculate average daily mileage over last 30 days
      SELECT COALESCE(
        (MAX(end_mileage) - MIN(start_mileage)) / GREATEST(COUNT(DISTINCT assignment_date), 1),
        50 -- Default 50 miles per day if no data
      )
      INTO avg_daily_mileage
      FROM public.daily_vehicle_assignments 
      WHERE vehicle_id = NEW.vehicle_id 
      AND assignment_date >= CURRENT_DATE - INTERVAL '30 days'
      AND start_mileage IS NOT NULL AND end_mileage IS NOT NULL;
      
      -- Calculate when vehicle will reach target mileage
      IF avg_daily_mileage > 0 AND current_mileage > 0 AND NEW.next_service_mileage > current_mileage THEN
        days_to_target := CEIL((NEW.next_service_mileage - current_mileage) / avg_daily_mileage);
        estimated_mileage_date := CURRENT_DATE + (days_to_target || ' days')::INTERVAL;
        
        -- Schedule mileage-based 7-day reminder
        IF days_to_target > 7 THEN
          INSERT INTO public.maintenance_notification_schedules (
            maintenance_record_id,
            notification_type,
            scheduled_for
          ) VALUES (
            NEW.id,
            'mileage_reminder',
            (estimated_mileage_date - INTERVAL '7 days')::timestamp with time zone + INTERVAL '8 hours'
          );
        END IF;
        
        -- Schedule mileage-based day-of reminder
        INSERT INTO public.maintenance_notification_schedules (
          maintenance_record_id,
          notification_type,
          scheduled_for
        ) VALUES (
          NEW.id,
          'mileage_reminder',
          estimated_mileage_date::timestamp with time zone + INTERVAL '8 hours'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for maintenance notification scheduling
CREATE TRIGGER schedule_maintenance_notifications_trigger
  AFTER INSERT OR UPDATE ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.schedule_maintenance_notifications();

-- Create function to export maintenance data as CSV format
CREATE OR REPLACE FUNCTION public.export_maintenance_csv(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  vehicle_ids UUID[] DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  csv_output TEXT := 'Vehicle,License Plate,Maintenance Type,Scheduled Date,Completed Date,Status,Cost,Vendor,Technician,Notes' || CHR(10);
  record_row RECORD;
BEGIN
  FOR record_row IN
    SELECT 
      v.vehicle_type,
      v.license_plate,
      COALESCE(mtt.name, mr.maintenance_type) as maintenance_type,
      mr.scheduled_date,
      mr.completed_date,
      mr.status,
      mr.total_cost,
      mv.name as vendor_name,
      CONCAT(mt.first_name, ' ', mt.last_name) as technician_name,
      mr.notes
    FROM public.maintenance_records mr
    LEFT JOIN public.vehicles v ON v.id = mr.vehicle_id
    LEFT JOIN public.maintenance_task_types mtt ON mtt.id = mr.task_type_id
    LEFT JOIN public.maintenance_vendors mv ON mv.id = mr.vendor_id
    LEFT JOIN public.maintenance_technicians mt ON mt.id = mr.technician_id
    WHERE (start_date IS NULL OR mr.scheduled_date >= start_date)
      AND (end_date IS NULL OR mr.scheduled_date <= end_date)
      AND (vehicle_ids IS NULL OR mr.vehicle_id = ANY(vehicle_ids))
    ORDER BY mr.scheduled_date DESC
  LOOP
    csv_output := csv_output || 
      COALESCE(record_row.vehicle_type, '') || ',' ||
      COALESCE(record_row.license_plate, '') || ',' ||
      COALESCE(record_row.maintenance_type, '') || ',' ||
      COALESCE(record_row.scheduled_date::TEXT, '') || ',' ||
      COALESCE(record_row.completed_date::TEXT, '') || ',' ||
      COALESCE(record_row.status, '') || ',' ||
      COALESCE(record_row.total_cost::TEXT, '') || ',' ||
      COALESCE(record_row.vendor_name, '') || ',' ||
      COALESCE(record_row.technician_name, '') || ',' ||
      COALESCE(REPLACE(record_row.notes, CHR(10), ' '), '') || CHR(10);
  END LOOP;
  
  RETURN csv_output;
END;
$$;