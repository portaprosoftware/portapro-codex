-- Create fuel_stations table
CREATE TABLE public.fuel_stations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  gps_coordinates POINT,
  default_cost_per_gallon NUMERIC(10,3),
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Create fuel_settings table for company preferences
CREATE TABLE public.fuel_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID, -- For multi-tenant support later
  fuel_unit TEXT NOT NULL DEFAULT 'gallons', -- 'gallons' or 'liters'
  currency_format TEXT NOT NULL DEFAULT 'USD',
  odometer_precision INTEGER NOT NULL DEFAULT 0, -- decimal places
  require_receipt BOOLEAN NOT NULL DEFAULT false,
  driver_edit_permission BOOLEAN NOT NULL DEFAULT true,
  manager_approval_threshold NUMERIC(10,2), -- require approval for logs above this amount
  csv_mapping_templates JSONB DEFAULT '[]'::jsonb,
  auto_calculate_mpg BOOLEAN NOT NULL DEFAULT true,
  default_fuel_station_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on fuel_stations
ALTER TABLE public.fuel_stations ENABLE ROW LEVEL SECURITY;

-- Create policy for fuel_stations
CREATE POLICY "Public access to fuel stations" 
ON public.fuel_stations 
FOR ALL 
USING (true);

-- Enable RLS on fuel_settings
ALTER TABLE public.fuel_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for fuel_settings
CREATE POLICY "Public access to fuel settings" 
ON public.fuel_settings 
FOR ALL 
USING (true);

-- Add updated_at trigger for fuel_stations
CREATE TRIGGER update_fuel_stations_updated_at
BEFORE UPDATE ON public.fuel_stations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for fuel_settings
CREATE TRIGGER update_fuel_settings_updated_at
BEFORE UPDATE ON public.fuel_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get fuel metrics
CREATE OR REPLACE FUNCTION public.get_fuel_metrics(start_date date, end_date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_gallons NUMERIC := 0;
  total_cost NUMERIC := 0;
  avg_cost_per_gallon NUMERIC := 0;
  fleet_mpg NUMERIC := 0;
  total_miles NUMERIC := 0;
  log_count INTEGER := 0;
  result jsonb;
BEGIN
  -- Get total gallons, cost, and count
  SELECT 
    COALESCE(SUM(gallons_purchased), 0),
    COALESCE(SUM(total_cost), 0),
    COUNT(*)
  INTO total_gallons, total_cost, log_count
  FROM public.fuel_logs
  WHERE log_date BETWEEN start_date AND end_date;
  
  -- Calculate average cost per gallon
  IF total_gallons > 0 THEN
    avg_cost_per_gallon := total_cost / total_gallons;
  END IF;
  
  -- Calculate fleet MPG (simplified - using odometer differences)
  SELECT COALESCE(SUM(
    CASE 
      WHEN lag(odometer_reading) OVER (PARTITION BY vehicle_id ORDER BY log_date) IS NOT NULL
      THEN odometer_reading - lag(odometer_reading) OVER (PARTITION BY vehicle_id ORDER BY log_date)
      ELSE 0
    END
  ), 0)
  INTO total_miles
  FROM public.fuel_logs
  WHERE log_date BETWEEN start_date AND end_date;
  
  -- Calculate fleet MPG
  IF total_gallons > 0 AND total_miles > 0 THEN
    fleet_mpg := total_miles / total_gallons;
  END IF;
  
  -- Build result JSON
  result := jsonb_build_object(
    'total_gallons', total_gallons,
    'total_cost', total_cost,
    'average_cost_per_gallon', avg_cost_per_gallon,
    'fleet_mpg', fleet_mpg,
    'total_miles', total_miles,
    'log_count', log_count,
    'period_start', start_date,
    'period_end', end_date
  );
  
  RETURN result;
END;
$$;

-- Create function to get vehicle efficiency
CREATE OR REPLACE FUNCTION public.get_vehicle_efficiency(start_date date, end_date date)
RETURNS TABLE(
  vehicle_id uuid,
  license_plate text,
  total_gallons numeric,
  total_miles numeric,
  mpg numeric,
  total_cost numeric,
  cost_per_mile numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH vehicle_stats AS (
    SELECT 
      fl.vehicle_id,
      v.license_plate,
      SUM(fl.gallons_purchased) as total_gallons,
      SUM(fl.total_cost) as total_cost,
      SUM(
        CASE 
          WHEN lag(fl.odometer_reading) OVER (PARTITION BY fl.vehicle_id ORDER BY fl.log_date) IS NOT NULL
          THEN fl.odometer_reading - lag(fl.odometer_reading) OVER (PARTITION BY fl.vehicle_id ORDER BY fl.log_date)
          ELSE 0
        END
      ) as total_miles
    FROM public.fuel_logs fl
    JOIN public.vehicles v ON v.id = fl.vehicle_id
    WHERE fl.log_date BETWEEN start_date AND end_date
    GROUP BY fl.vehicle_id, v.license_plate
  )
  SELECT 
    vs.vehicle_id,
    vs.license_plate,
    vs.total_gallons,
    vs.total_miles,
    CASE 
      WHEN vs.total_gallons > 0 AND vs.total_miles > 0 
      THEN vs.total_miles / vs.total_gallons 
      ELSE 0 
    END as mpg,
    vs.total_cost,
    CASE 
      WHEN vs.total_miles > 0 
      THEN vs.total_cost / vs.total_miles 
      ELSE 0 
    END as cost_per_mile
  FROM vehicle_stats vs
  ORDER BY vs.license_plate;
END;
$$;

-- Create function to get recent fuel logs
CREATE OR REPLACE FUNCTION public.get_recent_fuel_logs(limit_count integer DEFAULT 5)
RETURNS TABLE(
  id uuid,
  log_date date,
  vehicle_license text,
  driver_name text,
  gallons_purchased numeric,
  cost_per_gallon numeric,
  total_cost numeric,
  fuel_station text,
  odometer_reading integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fl.id,
    fl.log_date,
    v.license_plate as vehicle_license,
    COALESCE(p.first_name || ' ' || p.last_name, 'Unknown') as driver_name,
    fl.gallons_purchased,
    fl.cost_per_gallon,
    fl.total_cost,
    COALESCE(fl.fuel_station, 'Unknown Station') as fuel_station,
    fl.odometer_reading
  FROM public.fuel_logs fl
  LEFT JOIN public.vehicles v ON v.id = fl.vehicle_id
  LEFT JOIN public.profiles p ON p.id = fl.driver_id
  ORDER BY fl.log_date DESC, fl.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Insert default fuel settings
INSERT INTO public.fuel_settings (
  fuel_unit,
  currency_format,
  odometer_precision,
  require_receipt,
  driver_edit_permission,
  auto_calculate_mpg
) VALUES (
  'gallons',
  'USD',
  0,
  false,
  true,
  true
) ON CONFLICT DO NOTHING;