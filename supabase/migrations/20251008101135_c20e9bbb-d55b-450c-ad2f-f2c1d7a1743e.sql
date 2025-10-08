-- Phase 1: Enhance fuel_tanks table with comprehensive fields

-- Add identification fields
ALTER TABLE public.fuel_tanks
ADD COLUMN IF NOT EXISTS tank_type TEXT CHECK (tank_type IN ('above_ground', 'underground', 'mobile_skid')),
ADD COLUMN IF NOT EXISTS fuel_grade TEXT,
ADD COLUMN IF NOT EXISTS dispenser_type TEXT CHECK (dispenser_type IN ('gravity', 'electric_pump', 'manual')),
ADD COLUMN IF NOT EXISTS meter_serial_number TEXT,
ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';

-- Add capacity and location fields
ALTER TABLE public.fuel_tanks
ADD COLUMN IF NOT EXISTS usable_capacity_gallons NUMERIC,
ADD COLUMN IF NOT EXISTS secondary_containment_capacity NUMERIC,
ADD COLUMN IF NOT EXISTS gps_coordinates POINT,
ADD COLUMN IF NOT EXISTS access_notes TEXT;

-- Add compliance and safety fields
ALTER TABLE public.fuel_tanks
ADD COLUMN IF NOT EXISTS spcc_plan_on_file BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS spcc_document_url TEXT,
ADD COLUMN IF NOT EXISTS overfill_protection_type TEXT,
ADD COLUMN IF NOT EXISTS leak_detection_method TEXT,
ADD COLUMN IF NOT EXISTS emergency_shutoff_location TEXT,
ADD COLUMN IF NOT EXISTS fire_code_permit_number TEXT,
ADD COLUMN IF NOT EXISTS last_inspection_date DATE,
ADD COLUMN IF NOT EXISTS next_inspection_date DATE;

-- Add inventory control fields
ALTER TABLE public.fuel_tanks
ADD COLUMN IF NOT EXISTS initial_stick_reading NUMERIC,
ADD COLUMN IF NOT EXISTS reorder_threshold_gallons NUMERIC,
ADD COLUMN IF NOT EXISTS target_fill_level_gallons NUMERIC,
ADD COLUMN IF NOT EXISTS calibration_table_url TEXT,
ADD COLUMN IF NOT EXISTS notify_on_low_stock BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_emails TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notification_sms TEXT[] DEFAULT '{}';

-- Add security fields
ALTER TABLE public.fuel_tanks
ADD COLUMN IF NOT EXISTS lock_id TEXT,
ADD COLUMN IF NOT EXISTS tamper_seal_number TEXT;

-- Create fuel_tank_inventory_alerts table
CREATE TABLE IF NOT EXISTS public.fuel_tank_inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id UUID NOT NULL REFERENCES public.fuel_tanks(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_inventory', 'spcc_compliance', 'inspection_due', 'grade_mismatch', 'overfill_risk')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  alert_data JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_fuel_tank_alerts_tank_id ON public.fuel_tank_inventory_alerts(tank_id);
CREATE INDEX IF NOT EXISTS idx_fuel_tank_alerts_acknowledged ON public.fuel_tank_inventory_alerts(acknowledged) WHERE acknowledged = false;
CREATE INDEX IF NOT EXISTS idx_fuel_tank_alerts_type ON public.fuel_tank_inventory_alerts(alert_type);

-- Function to calculate average cost per gallon for a tank
CREATE OR REPLACE FUNCTION public.calculate_tank_cost_per_gallon(tank_uuid UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_cost NUMERIC;
BEGIN
  SELECT AVG(total_cost / gallons_delivered)
  INTO avg_cost
  FROM public.fuel_tank_deliveries
  WHERE tank_id = tank_uuid
    AND gallons_delivered > 0
    AND total_cost > 0
    AND delivery_date >= CURRENT_DATE - INTERVAL '90 days';
  
  RETURN COALESCE(avg_cost, 0);
END;
$$;

-- Function to check for low inventory and create alerts
CREATE OR REPLACE FUNCTION public.check_tank_low_inventory()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tank_record RECORD;
BEGIN
  FOR tank_record IN 
    SELECT id, tank_name, tank_number, current_level_gallons, reorder_threshold_gallons
    FROM public.fuel_tanks
    WHERE is_active = true
      AND notify_on_low_stock = true
      AND reorder_threshold_gallons IS NOT NULL
      AND current_level_gallons <= reorder_threshold_gallons
  LOOP
    -- Create alert if one doesn't already exist
    INSERT INTO public.fuel_tank_inventory_alerts (
      tank_id,
      alert_type,
      severity,
      message,
      alert_data
    )
    SELECT
      tank_record.id,
      'low_inventory',
      CASE 
        WHEN tank_record.current_level_gallons <= (tank_record.reorder_threshold_gallons * 0.5) THEN 'critical'
        WHEN tank_record.current_level_gallons <= (tank_record.reorder_threshold_gallons * 0.75) THEN 'high'
        ELSE 'medium'
      END,
      'Tank ' || tank_record.tank_number || ' (' || tank_record.tank_name || ') is below reorder threshold',
      jsonb_build_object(
        'current_level', tank_record.current_level_gallons,
        'threshold', tank_record.reorder_threshold_gallons
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM public.fuel_tank_inventory_alerts
      WHERE tank_id = tank_record.id
        AND alert_type = 'low_inventory'
        AND acknowledged = false
    );
  END LOOP;
END;
$$;

-- Function to calculate days of coverage remaining
CREATE OR REPLACE FUNCTION public.calculate_days_of_coverage(tank_uuid UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_level NUMERIC;
  avg_daily_usage NUMERIC;
  days_remaining NUMERIC;
BEGIN
  -- Get current level
  SELECT current_level_gallons INTO current_level
  FROM public.fuel_tanks
  WHERE id = tank_uuid;
  
  -- Calculate average daily usage from last 30 days
  SELECT AVG(daily_usage)
  INTO avg_daily_usage
  FROM (
    SELECT 
      DATE(created_at) as usage_date,
      SUM(gallons) as daily_usage
    FROM public.fuel_logs
    WHERE tank_id = tank_uuid
      AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(created_at)
  ) daily_totals;
  
  -- Calculate days remaining
  IF avg_daily_usage > 0 THEN
    days_remaining := current_level / avg_daily_usage;
  ELSE
    days_remaining := NULL;
  END IF;
  
  RETURN days_remaining;
END;
$$;

-- Trigger to auto-set next inspection date
CREATE OR REPLACE FUNCTION public.auto_set_tank_inspection_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If last_inspection_date is set and next_inspection_date is not, calculate it
  IF NEW.last_inspection_date IS NOT NULL AND NEW.next_inspection_date IS NULL THEN
    NEW.next_inspection_date := NEW.last_inspection_date + INTERVAL '12 months';
  END IF;
  
  -- Auto-set SPCC requirement based on capacity
  IF NEW.capacity_gallons >= 1320 THEN
    NEW.requires_spcc := true;
  ELSE
    NEW.requires_spcc := false;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_set_tank_inspection_date
BEFORE INSERT OR UPDATE ON public.fuel_tanks
FOR EACH ROW
EXECUTE FUNCTION public.auto_set_tank_inspection_date();

-- Function to check for upcoming inspections and create alerts
CREATE OR REPLACE FUNCTION public.check_tank_inspections_due()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tank_record RECORD;
  days_until_due INTEGER;
BEGIN
  FOR tank_record IN 
    SELECT id, tank_name, tank_number, next_inspection_date
    FROM public.fuel_tanks
    WHERE is_active = true
      AND next_inspection_date IS NOT NULL
      AND next_inspection_date <= CURRENT_DATE + INTERVAL '30 days'
  LOOP
    days_until_due := tank_record.next_inspection_date - CURRENT_DATE;
    
    -- Create alert if one doesn't already exist
    INSERT INTO public.fuel_tank_inventory_alerts (
      tank_id,
      alert_type,
      severity,
      message,
      alert_data
    )
    SELECT
      tank_record.id,
      'inspection_due',
      CASE 
        WHEN days_until_due <= 0 THEN 'critical'
        WHEN days_until_due <= 7 THEN 'high'
        WHEN days_until_due <= 14 THEN 'medium'
        ELSE 'low'
      END,
      'Tank ' || tank_record.tank_number || ' (' || tank_record.tank_name || ') inspection ' ||
      CASE 
        WHEN days_until_due <= 0 THEN 'is overdue'
        ELSE 'due in ' || days_until_due || ' days'
      END,
      jsonb_build_object(
        'inspection_date', tank_record.next_inspection_date,
        'days_until_due', days_until_due
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM public.fuel_tank_inventory_alerts
      WHERE tank_id = tank_record.id
        AND alert_type = 'inspection_due'
        AND acknowledged = false
    );
  END LOOP;
END;
$$;

-- Function to check SPCC compliance
CREATE OR REPLACE FUNCTION public.check_spcc_compliance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tank_record RECORD;
BEGIN
  FOR tank_record IN 
    SELECT id, tank_name, tank_number
    FROM public.fuel_tanks
    WHERE is_active = true
      AND requires_spcc = true
      AND spcc_plan_on_file = false
  LOOP
    -- Create alert if one doesn't already exist
    INSERT INTO public.fuel_tank_inventory_alerts (
      tank_id,
      alert_type,
      severity,
      message,
      alert_data
    )
    SELECT
      tank_record.id,
      'spcc_compliance',
      'high',
      'Tank ' || tank_record.tank_number || ' (' || tank_record.tank_name || ') requires SPCC plan but none is on file',
      jsonb_build_object('compliance_type', 'SPCC')
    WHERE NOT EXISTS (
      SELECT 1 FROM public.fuel_tank_inventory_alerts
      WHERE tank_id = tank_record.id
        AND alert_type = 'spcc_compliance'
        AND acknowledged = false
    );
  END LOOP;
END;
$$;