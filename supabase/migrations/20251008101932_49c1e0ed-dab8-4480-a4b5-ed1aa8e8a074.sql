-- Phase 1: Enhanced Fuel Tank Deliveries Schema

-- Create fuel_suppliers table for autocomplete
CREATE TABLE IF NOT EXISTS public.fuel_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name TEXT NOT NULL UNIQUE,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  payment_terms TEXT DEFAULT 'Net-30',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Extend fuel_tank_deliveries table with comprehensive fields
ALTER TABLE public.fuel_tank_deliveries
ADD COLUMN IF NOT EXISTS delivery_time TIME,
ADD COLUMN IF NOT EXISTS bol_ticket_number TEXT,
ADD COLUMN IF NOT EXISTS driver_name TEXT,
ADD COLUMN IF NOT EXISTS truck_number TEXT,
ADD COLUMN IF NOT EXISTS fuel_grade TEXT,
ADD COLUMN IF NOT EXISTS winter_blend BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS additive_notes TEXT,
ADD COLUMN IF NOT EXISTS gross_gallons NUMERIC,
ADD COLUMN IF NOT EXISTS temperature_corrected_gallons NUMERIC,
ADD COLUMN IF NOT EXISTS price_per_gallon_pretax NUMERIC,
ADD COLUMN IF NOT EXISTS excise_tax NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS hazmat_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_fees JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS pre_delivery_stick_reading NUMERIC,
ADD COLUMN IF NOT EXISTS post_delivery_stick_reading NUMERIC,
ADD COLUMN IF NOT EXISTS water_bottom_test_result TEXT CHECK (water_bottom_test_result IN ('pass', 'fail', NULL)),
ADD COLUMN IF NOT EXISTS water_bottom_inches NUMERIC,
ADD COLUMN IF NOT EXISTS calculated_variance NUMERIC,
ADD COLUMN IF NOT EXISTS variance_tolerance NUMERIC DEFAULT 2.0,
ADD COLUMN IF NOT EXISTS variance_flag BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ticket_photo_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dip_chart_url TEXT,
ADD COLUMN IF NOT EXISTS after_hours_delivery BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS partial_fill_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS entered_by TEXT,
ADD COLUMN IF NOT EXISTS verified_by TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS locked_to_ledger BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS locked_by TEXT;

-- Create delivery audit log table
CREATE TABLE IF NOT EXISTS public.delivery_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.fuel_tank_deliveries(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_audit_log_delivery_id ON public.delivery_audit_log(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_audit_log_created_at ON public.delivery_audit_log(created_at DESC);

-- Function to calculate delivery variance
CREATE OR REPLACE FUNCTION public.calculate_delivery_variance(delivery_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  delivery_record RECORD;
  variance NUMERIC;
  variance_pct NUMERIC;
  result JSONB;
BEGIN
  SELECT * INTO delivery_record
  FROM public.fuel_tank_deliveries
  WHERE id = delivery_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Delivery not found');
  END IF;
  
  -- Calculate variance if we have stick readings
  IF delivery_record.post_delivery_stick_reading IS NOT NULL 
     AND delivery_record.pre_delivery_stick_reading IS NOT NULL
     AND delivery_record.temperature_corrected_gallons IS NOT NULL THEN
    
    variance := (delivery_record.post_delivery_stick_reading - delivery_record.pre_delivery_stick_reading) 
                - delivery_record.temperature_corrected_gallons;
    
    variance_pct := (variance / NULLIF(delivery_record.temperature_corrected_gallons, 0)) * 100;
    
    result := jsonb_build_object(
      'variance_gallons', variance,
      'variance_percent', variance_pct,
      'exceeds_tolerance', ABS(variance_pct) > COALESCE(delivery_record.variance_tolerance, 2.0)
    );
    
    RETURN result;
  ELSE
    RETURN jsonb_build_object('error', 'Missing reconciliation data');
  END IF;
END;
$$;

-- Function to check fuel grade mismatch
CREATE OR REPLACE FUNCTION public.check_fuel_grade_mismatch(tank_uuid UUID, delivered_grade TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tank_grade TEXT;
  result JSONB;
BEGIN
  SELECT fuel_grade INTO tank_grade
  FROM public.fuel_tanks
  WHERE id = tank_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tank not found');
  END IF;
  
  IF tank_grade IS NULL OR delivered_grade IS NULL THEN
    RETURN jsonb_build_object('mismatch', false, 'message', 'Grade information incomplete');
  END IF;
  
  IF tank_grade != delivered_grade THEN
    result := jsonb_build_object(
      'mismatch', true,
      'message', 'Warning: Tank expects ' || tank_grade || ' but delivery shows ' || delivered_grade,
      'tank_grade', tank_grade,
      'delivered_grade', delivered_grade
    );
  ELSE
    result := jsonb_build_object('mismatch', false, 'message', 'Grade matches');
  END IF;
  
  RETURN result;
END;
$$;

-- Function to update tank current level after delivery
CREATE OR REPLACE FUNCTION public.update_tank_current_level_from_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  net_gallons NUMERIC;
BEGIN
  -- Use temperature-corrected gallons if available, otherwise use gross gallons
  net_gallons := COALESCE(NEW.temperature_corrected_gallons, NEW.gallons_delivered);
  
  -- Update tank current level
  UPDATE public.fuel_tanks
  SET 
    current_level_gallons = COALESCE(current_level_gallons, 0) + net_gallons,
    updated_at = now()
  WHERE id = NEW.tank_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-calculate variance and update tank level on delivery insert/update
CREATE OR REPLACE FUNCTION public.auto_calculate_delivery_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  variance_result JSONB;
  net_gallons NUMERIC;
BEGIN
  -- Set entered_by if not already set
  IF NEW.entered_by IS NULL AND TG_OP = 'INSERT' THEN
    NEW.entered_by := current_setting('request.jwt.claims', true)::json->>'sub';
  END IF;
  
  -- Default temperature-corrected to gross if not provided
  IF NEW.temperature_corrected_gallons IS NULL AND NEW.gross_gallons IS NOT NULL THEN
    NEW.temperature_corrected_gallons := NEW.gross_gallons;
  END IF;
  
  -- Calculate variance if we have reconciliation data
  IF NEW.post_delivery_stick_reading IS NOT NULL 
     AND NEW.pre_delivery_stick_reading IS NOT NULL 
     AND NEW.temperature_corrected_gallons IS NOT NULL THEN
    
    NEW.calculated_variance := (NEW.post_delivery_stick_reading - NEW.pre_delivery_stick_reading) 
                               - NEW.temperature_corrected_gallons;
    
    -- Set variance flag if exceeds tolerance
    IF ABS((NEW.calculated_variance / NULLIF(NEW.temperature_corrected_gallons, 0)) * 100) 
       > COALESCE(NEW.variance_tolerance, 2.0) THEN
      NEW.variance_flag := true;
    ELSE
      NEW.variance_flag := false;
    END IF;
  END IF;
  
  -- Auto-calculate total cost if not provided
  IF NEW.total_cost IS NULL AND NEW.price_per_gallon_pretax IS NOT NULL THEN
    net_gallons := COALESCE(NEW.temperature_corrected_gallons, NEW.gross_gallons, NEW.gallons_delivered);
    NEW.total_cost := (NEW.price_per_gallon_pretax * net_gallons)
                      + COALESCE(NEW.excise_tax, 0)
                      + COALESCE(NEW.delivery_fee, 0)
                      + COALESCE(NEW.hazmat_fee, 0);
  END IF;
  
  -- Auto-calculate cost_per_gallon
  net_gallons := COALESCE(NEW.temperature_corrected_gallons, NEW.gross_gallons, NEW.gallons_delivered);
  IF NEW.total_cost IS NOT NULL AND net_gallons > 0 THEN
    NEW.cost_per_gallon := NEW.total_cost / net_gallons;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_calculate_delivery_metrics
BEFORE INSERT OR UPDATE ON public.fuel_tank_deliveries
FOR EACH ROW
EXECUTE FUNCTION public.auto_calculate_delivery_metrics();

CREATE TRIGGER trigger_update_tank_level_from_delivery
AFTER INSERT ON public.fuel_tank_deliveries
FOR EACH ROW
EXECUTE FUNCTION public.update_tank_current_level_from_delivery();

-- Function to lock delivery to ledger (requires approval)
CREATE OR REPLACE FUNCTION public.lock_delivery_to_ledger(delivery_uuid UUID, locked_by_user TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update delivery record
  UPDATE public.fuel_tank_deliveries
  SET 
    locked_to_ledger = true,
    locked_at = now(),
    locked_by = locked_by_user
  WHERE id = delivery_uuid;
  
  -- Log the action
  INSERT INTO public.delivery_audit_log (delivery_id, action_type, changed_by, change_reason)
  VALUES (delivery_uuid, 'locked', locked_by_user, 'Locked to ledger for accounting');
  
  RETURN true;
END;
$$;

-- Function to verify delivery (approval workflow)
CREATE OR REPLACE FUNCTION public.verify_delivery(delivery_uuid UUID, verified_by_user TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.fuel_tank_deliveries
  SET 
    verified_by = verified_by_user,
    verified_at = now()
  WHERE id = delivery_uuid;
  
  -- Log the action
  INSERT INTO public.delivery_audit_log (delivery_id, action_type, changed_by, change_reason)
  VALUES (delivery_uuid, 'verified', verified_by_user, 'Delivery verified by approver');
  
  RETURN true;
END;
$$;