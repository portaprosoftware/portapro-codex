-- Drop existing get_vehicle_efficiency function and recreate with correct return type
DROP FUNCTION IF EXISTS public.get_vehicle_efficiency(date, date);

-- Create get_vehicle_efficiency function for fleet fuel reports
CREATE OR REPLACE FUNCTION public.get_vehicle_efficiency(start_date date, end_date date)
RETURNS TABLE(
  vehicle_id uuid,
  license_plate text,
  total_gallons numeric,
  total_miles integer,
  mpg numeric,
  total_cost numeric,
  cost_per_mile numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id as vehicle_id,
    v.license_plate,
    COALESCE(SUM(fl.gallons_purchased), 0) as total_gallons,
    COALESCE(MAX(fl.odometer_reading) - MIN(fl.odometer_reading), 0) as total_miles,
    CASE 
      WHEN COALESCE(SUM(fl.gallons_purchased), 0) > 0 AND 
           COALESCE(MAX(fl.odometer_reading) - MIN(fl.odometer_reading), 0) > 0
      THEN (MAX(fl.odometer_reading) - MIN(fl.odometer_reading))::numeric / SUM(fl.gallons_purchased)
      ELSE 0
    END as mpg,
    COALESCE(SUM(fl.total_cost), 0) as total_cost,
    CASE 
      WHEN COALESCE(MAX(fl.odometer_reading) - MIN(fl.odometer_reading), 0) > 0
      THEN SUM(fl.total_cost) / (MAX(fl.odometer_reading) - MIN(fl.odometer_reading))
      ELSE 0
    END as cost_per_mile
  FROM public.vehicles v
  LEFT JOIN public.fuel_logs fl ON v.id = fl.vehicle_id 
    AND fl.log_date >= start_date 
    AND fl.log_date <= end_date
  WHERE v.status = 'active'
  GROUP BY v.id, v.license_plate
  ORDER BY v.license_plate;
END;
$$;