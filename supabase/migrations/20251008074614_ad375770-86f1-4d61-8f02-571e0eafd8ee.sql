-- Create fuel type enum
CREATE TYPE fuel_type AS ENUM ('diesel', 'gasoline', 'off_road_diesel');

-- Create fuel source enum  
CREATE TYPE fuel_source AS ENUM ('retail_station', 'yard_tank', 'mobile_vendor');

-- Create fuel stations table (retail locations)
CREATE TABLE IF NOT EXISTS public.fuel_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  accepts_fuel_card BOOLEAN DEFAULT false,
  fuel_card_provider TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create fuel tanks table (on-site bulk storage)
CREATE TABLE IF NOT EXISTS public.fuel_tanks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_number TEXT NOT NULL UNIQUE,
  tank_name TEXT NOT NULL,
  fuel_type fuel_type NOT NULL,
  capacity_gallons NUMERIC NOT NULL,
  current_level_gallons NUMERIC DEFAULT 0,
  location_description TEXT,
  last_inspection_date DATE,
  next_inspection_date DATE,
  requires_spcc BOOLEAN GENERATED ALWAYS AS (capacity_gallons >= 1320) STORED,
  installation_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create fuel tank deliveries table
CREATE TABLE IF NOT EXISTS public.fuel_tank_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id UUID NOT NULL REFERENCES public.fuel_tanks(id) ON DELETE CASCADE,
  delivery_date DATE NOT NULL,
  gallons_delivered NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  cost_per_gallon NUMERIC GENERATED ALWAYS AS (
    CASE WHEN gallons_delivered > 0 THEN total_cost / gallons_delivered ELSE 0 END
  ) STORED,
  supplier_name TEXT,
  invoice_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create mobile fuel vendors table
CREATE TABLE IF NOT EXISTS public.mobile_fuel_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  fuel_type fuel_type NOT NULL,
  service_area TEXT,
  contract_number TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create mobile fuel services table
CREATE TABLE IF NOT EXISTS public.mobile_fuel_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.mobile_fuel_vendors(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  total_gallons NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  cost_per_gallon NUMERIC GENERATED ALWAYS AS (
    CASE WHEN total_gallons > 0 THEN total_cost / total_gallons ELSE 0 END
  ) STORED,
  vehicles_fueled INTEGER DEFAULT 1,
  location TEXT,
  invoice_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add fuel source and type columns to fuel_logs
ALTER TABLE public.fuel_logs 
ADD COLUMN IF NOT EXISTS fuel_type fuel_type,
ADD COLUMN IF NOT EXISTS fuel_source fuel_source,
ADD COLUMN IF NOT EXISTS fuel_station_id UUID REFERENCES public.fuel_stations(id),
ADD COLUMN IF NOT EXISTS fuel_tank_id UUID REFERENCES public.fuel_tanks(id),
ADD COLUMN IF NOT EXISTS mobile_vendor_id UUID REFERENCES public.mobile_fuel_vendors(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fuel_tanks_active ON public.fuel_tanks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_fuel_tanks_spcc ON public.fuel_tanks(capacity_gallons) WHERE capacity_gallons >= 1320;
CREATE INDEX IF NOT EXISTS idx_fuel_tank_deliveries_tank ON public.fuel_tank_deliveries(tank_id);
CREATE INDEX IF NOT EXISTS idx_fuel_tank_deliveries_date ON public.fuel_tank_deliveries(delivery_date DESC);
CREATE INDEX IF NOT EXISTS idx_mobile_vendors_active ON public.mobile_fuel_vendors(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_mobile_services_vendor ON public.mobile_fuel_services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_mobile_services_date ON public.mobile_fuel_services(service_date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_source ON public.fuel_logs(fuel_source);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_station ON public.fuel_logs(fuel_station_id);

-- Create update timestamp triggers
CREATE OR REPLACE FUNCTION update_fuel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fuel_stations_updated_at
  BEFORE UPDATE ON public.fuel_stations
  FOR EACH ROW EXECUTE FUNCTION update_fuel_updated_at();

CREATE TRIGGER update_fuel_tanks_updated_at
  BEFORE UPDATE ON public.fuel_tanks
  FOR EACH ROW EXECUTE FUNCTION update_fuel_updated_at();

CREATE TRIGGER update_fuel_tank_deliveries_updated_at
  BEFORE UPDATE ON public.fuel_tank_deliveries
  FOR EACH ROW EXECUTE FUNCTION update_fuel_updated_at();

CREATE TRIGGER update_mobile_fuel_vendors_updated_at
  BEFORE UPDATE ON public.mobile_fuel_vendors
  FOR EACH ROW EXECUTE FUNCTION update_fuel_updated_at();

CREATE TRIGGER update_mobile_fuel_services_updated_at
  BEFORE UPDATE ON public.mobile_fuel_services
  FOR EACH ROW EXECUTE FUNCTION update_fuel_updated_at();