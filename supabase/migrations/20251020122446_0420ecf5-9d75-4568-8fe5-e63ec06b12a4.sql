-- ============================================
-- Phase 5: Database Setup
-- ============================================

-- 5.1: Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id_read_created 
  ON public.notification_logs(user_id, read_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at 
  ON public.notification_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_related_entity 
  ON public.notification_logs(related_entity_type, related_entity_id);

-- 5.2: Create Driver Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.driver_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id TEXT NOT NULL UNIQUE,
  
  -- Notification type toggles
  job_assigned BOOLEAN DEFAULT true,
  job_updated BOOLEAN DEFAULT true,
  job_cancelled BOOLEAN DEFAULT true,
  schedule_changed BOOLEAN DEFAULT true,
  dvir_reminder BOOLEAN DEFAULT true,
  vehicle_assigned BOOLEAN DEFAULT true,
  message_received BOOLEAN DEFAULT true,
  
  -- Delivery methods
  in_app_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  sms_notifications BOOLEAN DEFAULT false,
  
  -- Quiet hours (optional feature)
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Drivers can view own preferences"
  ON public.driver_notification_preferences
  FOR SELECT
  USING (true);

CREATE POLICY "Drivers can update own preferences"
  ON public.driver_notification_preferences
  FOR UPDATE
  USING (true);

CREATE POLICY "Drivers can insert own preferences"
  ON public.driver_notification_preferences
  FOR INSERT
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE TRIGGER update_driver_notification_preferences_updated_at
  BEFORE UPDATE ON public.driver_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_timestamp();

-- Index for quick lookups
CREATE INDEX idx_driver_notification_preferences_driver_id 
  ON public.driver_notification_preferences(driver_id);

-- 5.3: Create Helper Function to Check Preferences
CREATE OR REPLACE FUNCTION public.should_notify_driver(
  p_driver_id TEXT,
  p_notification_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  preferences RECORD;
BEGIN
  -- Get driver preferences, default to true if not found
  SELECT * INTO preferences
  FROM public.driver_notification_preferences
  WHERE driver_id = p_driver_id;
  
  -- If no preferences exist, allow all notifications
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;
  
  -- Check if in-app notifications are enabled
  IF NOT preferences.in_app_notifications THEN
    RETURN FALSE;
  END IF;
  
  -- Check specific notification type preference
  RETURN CASE p_notification_type
    WHEN 'job_assigned' THEN preferences.job_assigned
    WHEN 'job_updated' THEN preferences.job_updated
    WHEN 'job_cancelled' THEN preferences.job_cancelled
    WHEN 'schedule_changed' THEN preferences.schedule_changed
    WHEN 'dvir_reminder' THEN preferences.dvir_reminder
    WHEN 'vehicle_assigned' THEN preferences.vehicle_assigned
    WHEN 'message_received' THEN preferences.message_received
    ELSE TRUE
  END;
END;
$$;

-- ============================================
-- Phase 4: Backend Logic - Automated Notifications
-- ============================================

-- 4.1: Job Assignment Notification Trigger
CREATE OR REPLACE FUNCTION public.notify_driver_job_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_name TEXT;
  job_address TEXT;
BEGIN
  -- Only proceed if driver_id was just set (assigned)
  IF NEW.driver_id IS NOT NULL AND (OLD.driver_id IS NULL OR OLD.driver_id != NEW.driver_id) THEN
    
    -- Check if driver wants this notification
    IF NOT public.should_notify_driver(NEW.driver_id, 'job_assigned') THEN
      RETURN NEW;
    END IF;
    
    -- Get customer and location details
    SELECT 
      c.name,
      COALESCE(c.service_street || ', ' || c.service_city || ', ' || c.service_state, c.service_address, 'No address')
    INTO customer_name, job_address
    FROM public.customers c
    WHERE c.id = NEW.customer_id;
    
    -- Create notification
    INSERT INTO public.notification_logs (
      user_id,
      notification_type,
      title,
      body,
      related_entity_type,
      related_entity_id,
      data
    ) VALUES (
      NEW.driver_id,
      'job_assigned',
      'New Job Assigned',
      format('Job #%s assigned for %s at %s', NEW.job_number, customer_name, job_address),
      'job',
      NEW.id,
      jsonb_build_object(
        'job_id', NEW.id,
        'job_number', NEW.job_number,
        'job_type', NEW.job_type,
        'customer_name', customer_name,
        'scheduled_date', NEW.scheduled_date,
        'scheduled_time', NEW.scheduled_time,
        'address', job_address
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_driver_job_assigned ON public.jobs;
CREATE TRIGGER trigger_notify_driver_job_assigned
  AFTER INSERT OR UPDATE OF driver_id ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_driver_job_assigned();

-- 4.2: Job Update Notification Trigger
CREATE OR REPLACE FUNCTION public.notify_driver_job_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  changes TEXT[];
  change_summary TEXT;
BEGIN
  -- Only notify if job has a driver and meaningful fields changed
  IF NEW.driver_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if driver wants this notification
  IF NOT public.should_notify_driver(NEW.driver_id, 'job_updated') THEN
    RETURN NEW;
  END IF;
  
  -- Detect what changed
  changes := ARRAY[]::TEXT[];
  
  IF OLD.scheduled_date != NEW.scheduled_date THEN
    changes := array_append(changes, format('Date changed to %s', NEW.scheduled_date));
  END IF;
  
  IF OLD.scheduled_time IS DISTINCT FROM NEW.scheduled_time THEN
    changes := array_append(changes, format('Time changed to %s', COALESCE(NEW.scheduled_time, 'TBD')));
  END IF;
  
  IF OLD.notes IS DISTINCT FROM NEW.notes THEN
    changes := array_append(changes, 'Notes updated');
  END IF;
  
  IF OLD.special_instructions IS DISTINCT FROM NEW.special_instructions THEN
    changes := array_append(changes, 'Special instructions updated');
  END IF;
  
  IF OLD.is_priority != NEW.is_priority THEN
    changes := array_append(changes, CASE WHEN NEW.is_priority THEN 'Marked as PRIORITY' ELSE 'Priority removed' END);
  END IF;
  
  -- Only create notification if there are meaningful changes
  IF array_length(changes, 1) > 0 THEN
    change_summary := array_to_string(changes, ', ');
    
    INSERT INTO public.notification_logs (
      user_id,
      notification_type,
      title,
      body,
      related_entity_type,
      related_entity_id,
      data
    ) VALUES (
      NEW.driver_id,
      'job_updated',
      format('Job #%s Updated', NEW.job_number),
      change_summary,
      'job',
      NEW.id,
      jsonb_build_object(
        'job_id', NEW.id,
        'job_number', NEW.job_number,
        'changes', changes,
        'scheduled_date', NEW.scheduled_date,
        'scheduled_time', NEW.scheduled_time,
        'is_priority', NEW.is_priority
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_driver_job_updated ON public.jobs;
CREATE TRIGGER trigger_notify_driver_job_updated
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  WHEN (OLD.driver_id IS NOT NULL AND OLD.driver_id = NEW.driver_id)
  EXECUTE FUNCTION public.notify_driver_job_updated();

-- 4.3: Job Cancellation Notification Trigger
CREATE OR REPLACE FUNCTION public.notify_driver_job_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only notify if job had a driver and is now cancelled
  IF NEW.driver_id IS NOT NULL AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    
    -- Check if driver wants this notification
    IF NOT public.should_notify_driver(NEW.driver_id, 'job_cancelled') THEN
      RETURN NEW;
    END IF;
    
    INSERT INTO public.notification_logs (
      user_id,
      notification_type,
      title,
      body,
      related_entity_type,
      related_entity_id,
      data
    ) VALUES (
      NEW.driver_id,
      'job_cancelled',
      format('Job #%s Cancelled', NEW.job_number),
      COALESCE('Reason: ' || NEW.cancellation_reason, 'Job has been cancelled'),
      'job',
      NEW.id,
      jsonb_build_object(
        'job_id', NEW.id,
        'job_number', NEW.job_number,
        'cancellation_reason', NEW.cancellation_reason,
        'scheduled_date', NEW.scheduled_date
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_driver_job_cancelled ON public.jobs;
CREATE TRIGGER trigger_notify_driver_job_cancelled
  AFTER UPDATE OF status ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_driver_job_cancelled();

-- 4.4: Vehicle Assignment Notification Trigger
CREATE OR REPLACE FUNCTION public.notify_driver_vehicle_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vehicle_info TEXT;
BEGIN
  -- Only proceed if driver_id is set and vehicle changed
  IF NEW.driver_id IS NOT NULL AND (OLD.vehicle_id IS NULL OR OLD.vehicle_id != NEW.vehicle_id) AND NEW.vehicle_id IS NOT NULL THEN
    
    -- Check if driver wants this notification
    IF NOT public.should_notify_driver(NEW.driver_id, 'vehicle_assigned') THEN
      RETURN NEW;
    END IF;
    
    -- Get vehicle details
    SELECT license_plate
    INTO vehicle_info
    FROM public.vehicles
    WHERE id = NEW.vehicle_id;
    
    INSERT INTO public.notification_logs (
      user_id,
      notification_type,
      title,
      body,
      related_entity_type,
      related_entity_id,
      data
    ) VALUES (
      NEW.driver_id,
      'vehicle_assigned',
      'Vehicle Assignment Updated',
      format('Vehicle %s assigned for job #%s', COALESCE(vehicle_info, 'Unknown'), NEW.job_number),
      'job',
      NEW.id,
      jsonb_build_object(
        'job_id', NEW.id,
        'vehicle_id', NEW.vehicle_id,
        'job_number', NEW.job_number
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_driver_vehicle_assigned ON public.jobs;
CREATE TRIGGER trigger_notify_driver_vehicle_assigned
  AFTER INSERT OR UPDATE OF vehicle_id ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_driver_vehicle_assigned();