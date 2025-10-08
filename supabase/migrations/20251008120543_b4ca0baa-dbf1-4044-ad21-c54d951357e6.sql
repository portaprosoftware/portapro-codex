-- Create unified fuel consumption view combining all three fuel sources
CREATE OR REPLACE VIEW unified_fuel_consumption AS
-- Retail fuel logs
SELECT 
  fl.id as reference_id,
  'retail'::text as source_type,
  COALESCE(fl.fuel_station, 'Unknown Station') as source_name,
  fl.vehicle_id,
  fl.driver_id,
  fl.log_date as fuel_date,
  fl.gallons_purchased as gallons,
  fl.total_cost as cost,
  fl.cost_per_gallon,
  fl.odometer_reading,
  fl.fuel_type::text,
  fl.notes,
  NULL::uuid as vendor_id,
  NULL::uuid as tank_id,
  fl.created_at
FROM public.fuel_logs fl
WHERE fl.fuel_source::text = 'retail'

UNION ALL

-- Yard tank draws
SELECT 
  fl.id as reference_id,
  'yard_tank'::text as source_type,
  COALESCE(
    (SELECT tank_name FROM public.fuel_tanks ft WHERE ft.id = fl.fuel_tank_id),
    'Unknown Tank'
  ) as source_name,
  fl.vehicle_id,
  fl.driver_id,
  fl.log_date as fuel_date,
  fl.gallons_purchased as gallons,
  fl.total_cost as cost,
  fl.cost_per_gallon,
  fl.odometer_reading,
  fl.fuel_type::text,
  fl.notes,
  NULL::uuid as vendor_id,
  fl.fuel_tank_id as tank_id,
  fl.created_at
FROM public.fuel_logs fl
WHERE fl.fuel_source::text = 'yard_tank'

UNION ALL

-- Mobile vendor services (per vehicle)
SELECT 
  mfsv.id as reference_id,
  'mobile_service'::text as source_type,
  COALESCE(mfv.vendor_name, 'Unknown Vendor') as source_name,
  mfsv.vehicle_id,
  NULL::text as driver_id,
  mfs.service_date as fuel_date,
  mfsv.gallons_dispensed as gallons,
  CASE 
    WHEN mfs.total_gallons > 0 THEN 
      (mfs.total_cost / mfs.total_gallons) * mfsv.gallons_dispensed
    ELSE 0
  END as cost,
  mfs.price_per_gallon as cost_per_gallon,
  mfsv.odometer_reading,
  mfs.fuel_grade::text as fuel_type,
  COALESCE(mfsv.vehicle_notes, mfs.notes) as notes,
  mfs.vendor_id,
  NULL::uuid as tank_id,
  mfsv.created_at
FROM public.mobile_fuel_service_vehicles mfsv
INNER JOIN public.mobile_fuel_services mfs ON mfs.id = mfsv.service_id
LEFT JOIN public.mobile_fuel_vendors mfv ON mfv.id = mfs.vendor_id;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fuel_logs_source ON public.fuel_logs(fuel_source);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON public.fuel_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_mobile_service_date ON public.mobile_fuel_services(service_date DESC);

-- Add helpful comment
COMMENT ON VIEW unified_fuel_consumption IS 'Unified view combining retail fuel logs, yard tank draws, and mobile vendor services for comprehensive fuel consumption reporting';
