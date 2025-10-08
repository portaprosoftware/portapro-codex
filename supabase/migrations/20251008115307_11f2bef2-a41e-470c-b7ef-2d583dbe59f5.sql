-- Tier 2: Vehicle Tracking & Verification

-- Add verification and variance fields to mobile_fuel_services
ALTER TABLE mobile_fuel_services
ADD COLUMN verified_by_user_id TEXT,
ADD COLUMN delivery_ticket_urls TEXT[] DEFAULT '{}',
ADD COLUMN variance_flag BOOLEAN DEFAULT false,
ADD COLUMN variance_notes TEXT;

-- Create junction table for vehicle-level fuel distribution
CREATE TABLE mobile_fuel_service_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES mobile_fuel_services(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  gallons_dispensed NUMERIC(10,2) NOT NULL CHECK (gallons_dispensed >= 0),
  odometer_reading INTEGER,
  vehicle_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_mobile_fuel_service_vehicles_service_id ON mobile_fuel_service_vehicles(service_id);
CREATE INDEX idx_mobile_fuel_service_vehicles_vehicle_id ON mobile_fuel_service_vehicles(vehicle_id);

-- Trigger to auto-calculate variance flag
CREATE OR REPLACE FUNCTION check_mobile_fuel_variance()
RETURNS TRIGGER AS $$
DECLARE
  total_vehicle_gallons NUMERIC;
  service_total NUMERIC;
BEGIN
  -- Get total gallons from vehicle breakdown
  SELECT COALESCE(SUM(gallons_dispensed), 0)
  INTO total_vehicle_gallons
  FROM mobile_fuel_service_vehicles
  WHERE service_id = NEW.service_id;
  
  -- Get total from service record
  SELECT total_gallons
  INTO service_total
  FROM mobile_fuel_services
  WHERE id = NEW.service_id;
  
  -- Update variance flag if discrepancy > 1 gallon
  UPDATE mobile_fuel_services
  SET variance_flag = (ABS(service_total - total_vehicle_gallons) > 1)
  WHERE id = NEW.service_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mobile_fuel_variance_check
AFTER INSERT OR UPDATE OR DELETE ON mobile_fuel_service_vehicles
FOR EACH ROW
EXECUTE FUNCTION check_mobile_fuel_variance();