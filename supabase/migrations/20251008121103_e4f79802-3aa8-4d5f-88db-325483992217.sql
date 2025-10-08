-- Phase 5: Automatic Tank Level Updates
-- Create audit table for tracking all tank level changes

CREATE TABLE IF NOT EXISTS fuel_tank_level_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id UUID NOT NULL REFERENCES fuel_tanks(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('delivery', 'draw', 'adjustment', 'initial')),
  previous_level_gallons NUMERIC NOT NULL,
  change_amount_gallons NUMERIC NOT NULL,
  new_level_gallons NUMERIC NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('delivery', 'fuel_log', 'manual')),
  reference_id UUID,
  performed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tank_level_history_tank ON fuel_tank_level_history(tank_id);
CREATE INDEX idx_tank_level_history_created ON fuel_tank_level_history(created_at DESC);

-- Function to update tank level and create history entry
CREATE OR REPLACE FUNCTION update_tank_level(
  p_tank_id UUID,
  p_change_amount NUMERIC,
  p_change_type TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_performed_by TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_previous_level NUMERIC;
  v_new_level NUMERIC;
  v_capacity NUMERIC;
  v_tank_name TEXT;
  v_reorder_threshold NUMERIC;
BEGIN
  -- Get current tank info
  SELECT current_level_gallons, capacity_gallons, tank_name, reorder_threshold_gallons
  INTO v_previous_level, v_capacity, v_tank_name, v_reorder_threshold
  FROM fuel_tanks
  WHERE id = p_tank_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tank not found'
    );
  END IF;

  -- Calculate new level
  v_new_level := v_previous_level + p_change_amount;

  -- Validate new level
  IF v_new_level < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient fuel in tank. Current: ' || v_previous_level || ' gal, Requested: ' || ABS(p_change_amount) || ' gal'
    );
  END IF;

  IF v_new_level > v_capacity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Delivery would exceed tank capacity. Capacity: ' || v_capacity || ' gal, New level would be: ' || v_new_level || ' gal'
    );
  END IF;

  -- Update tank level
  UPDATE fuel_tanks
  SET 
    current_level_gallons = v_new_level,
    updated_at = now()
  WHERE id = p_tank_id;

  -- Create history entry
  INSERT INTO fuel_tank_level_history (
    tank_id,
    change_type,
    previous_level_gallons,
    change_amount_gallons,
    new_level_gallons,
    reference_type,
    reference_id,
    performed_by,
    notes
  ) VALUES (
    p_tank_id,
    p_change_type,
    v_previous_level,
    p_change_amount,
    v_new_level,
    p_reference_type,
    p_reference_id,
    p_performed_by,
    p_notes
  );

  -- Check if below reorder threshold
  IF v_new_level <= COALESCE(v_reorder_threshold, 0) THEN
    RAISE LOG 'Tank % (%) is below reorder threshold. Current: % gal, Threshold: % gal',
      v_tank_name, p_tank_id, v_new_level, v_reorder_threshold;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'previous_level', v_previous_level,
    'change_amount', p_change_amount,
    'new_level', v_new_level,
    'below_threshold', v_new_level <= COALESCE(v_reorder_threshold, 0)
  );
END;
$$;

-- Trigger function for fuel tank deliveries
CREATE OR REPLACE FUNCTION trigger_tank_delivery_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only process on INSERT (new deliveries)
  IF TG_OP = 'INSERT' THEN
    -- Update tank level
    v_result := update_tank_level(
      p_tank_id := NEW.tank_id,
      p_change_amount := NEW.gallons_delivered,
      p_change_type := 'delivery',
      p_reference_type := 'delivery',
      p_reference_id := NEW.id,
      p_notes := 'Delivery from ' || COALESCE(NEW.supplier_name, 'Unknown Supplier')
    );

    -- Check if update was successful
    IF NOT (v_result->>'success')::boolean THEN
      RAISE EXCEPTION 'Failed to update tank level: %', v_result->>'error';
    END IF;

    -- Log low level warning if needed
    IF (v_result->>'below_threshold')::boolean THEN
      RAISE NOTICE 'Tank is below reorder threshold after delivery';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger function for yard tank fuel draws
CREATE OR REPLACE FUNCTION trigger_yard_tank_draw_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_vehicle_info TEXT;
BEGIN
  -- Only process fuel logs that are yard tank draws
  IF TG_OP = 'INSERT' AND NEW.fuel_source::text = 'yard_tank' AND NEW.fuel_tank_id IS NOT NULL THEN
    
    -- Build vehicle info for notes
    SELECT COALESCE(license_plate || ' (' || make || ' ' || model || ')', 'Unknown Vehicle')
    INTO v_vehicle_info
    FROM vehicles
    WHERE id = NEW.vehicle_id;

    -- Update tank level (negative amount = draw)
    v_result := update_tank_level(
      p_tank_id := NEW.fuel_tank_id,
      p_change_amount := -NEW.gallons_purchased,
      p_change_type := 'draw',
      p_reference_type := 'fuel_log',
      p_reference_id := NEW.id,
      p_performed_by := NEW.driver_id,
      p_notes := 'Fuel draw for vehicle: ' || v_vehicle_info
    );

    -- Check if update was successful
    IF NOT (v_result->>'success')::boolean THEN
      RAISE EXCEPTION 'Failed to update tank level: %', v_result->>'error';
    END IF;

    -- Log low level warning if needed
    IF (v_result->>'below_threshold')::boolean THEN
      RAISE WARNING 'Tank % is below reorder threshold. Current level: % gal',
        NEW.fuel_tank_id,
        (v_result->>'new_level')::numeric;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS tank_delivery_level_update ON fuel_tank_deliveries;
CREATE TRIGGER tank_delivery_level_update
  AFTER INSERT ON fuel_tank_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_tank_delivery_update();

DROP TRIGGER IF EXISTS yard_tank_draw_level_update ON fuel_logs;
CREATE TRIGGER yard_tank_draw_level_update
  AFTER INSERT ON fuel_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_yard_tank_draw_update();

-- Add helpful comments
COMMENT ON TABLE fuel_tank_level_history IS 'Audit log of all fuel tank level changes for tracking and rollback';
COMMENT ON FUNCTION update_tank_level IS 'Safely updates fuel tank levels with validation and history tracking';
COMMENT ON FUNCTION trigger_tank_delivery_update IS 'Automatically increments tank level when deliveries are recorded';
COMMENT ON FUNCTION trigger_yard_tank_draw_update IS 'Automatically decrements tank level when fuel is drawn for vehicles';
