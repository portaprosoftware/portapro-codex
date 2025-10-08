-- Phase 7: Fuel Management Settings & Configuration

-- Create fuel management settings table
CREATE TABLE IF NOT EXISTS fuel_management_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Fuel Source Controls
  retail_enabled BOOLEAN NOT NULL DEFAULT true,
  yard_tank_enabled BOOLEAN NOT NULL DEFAULT true,
  mobile_service_enabled BOOLEAN NOT NULL DEFAULT true,
  default_fuel_source TEXT CHECK (default_fuel_source IN ('retail', 'yard_tank', 'mobile_service')) DEFAULT 'retail',
  
  -- Alert Thresholds
  tank_low_threshold_percent NUMERIC NOT NULL DEFAULT 25.0,
  tank_critical_threshold_percent NUMERIC NOT NULL DEFAULT 10.0,
  unusual_consumption_threshold_percent NUMERIC NOT NULL DEFAULT 150.0,
  price_spike_threshold_percent NUMERIC NOT NULL DEFAULT 15.0,
  
  -- Auto-Calculation Rules
  auto_calculate_mpg BOOLEAN NOT NULL DEFAULT true,
  auto_calculate_cost_per_mile BOOLEAN NOT NULL DEFAULT true,
  auto_flag_high_consumption BOOLEAN NOT NULL DEFAULT true,
  auto_flag_price_spikes BOOLEAN NOT NULL DEFAULT true,
  
  -- Integration Toggles
  auto_update_tank_levels BOOLEAN NOT NULL DEFAULT true,
  variance_tolerance_percent NUMERIC NOT NULL DEFAULT 5.0,
  
  -- Notification Preferences
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  sms_notifications BOOLEAN NOT NULL DEFAULT false,
  notification_email TEXT,
  notification_phone TEXT,
  notification_frequency TEXT CHECK (notification_frequency IN ('immediate', 'daily', 'weekly')) DEFAULT 'daily',
  
  -- SPCC Compliance
  spcc_compliance_enabled BOOLEAN NOT NULL DEFAULT false,
  spcc_tank_threshold_gallons NUMERIC NOT NULL DEFAULT 1320,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO fuel_management_settings (id) 
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fuel_management_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER fuel_management_settings_updated_at
  BEFORE UPDATE ON fuel_management_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_fuel_management_settings_updated_at();

-- Add helpful comments
COMMENT ON TABLE fuel_management_settings IS 'Global configuration settings for fuel management system';
COMMENT ON COLUMN fuel_management_settings.auto_update_tank_levels IS 'When true, tank levels are automatically updated from deliveries and draws';
COMMENT ON COLUMN fuel_management_settings.variance_tolerance_percent IS 'Acceptable variance percentage for tank level discrepancies';
COMMENT ON COLUMN fuel_management_settings.spcc_compliance_enabled IS 'Enable SPCC compliance tracking for tanks over threshold';
