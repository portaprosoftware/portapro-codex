-- Drop the existing view
DROP VIEW IF EXISTS unified_fuel_consumption;

-- Recreate the view with all three fuel sources using correct column names
CREATE OR REPLACE VIEW unified_fuel_consumption AS
-- Retail fuel logs from fuel_logs table
SELECT 
  fl.id::text AS reference_id,
  'retail'::text AS source_type,
  COALESCE(v.license_plate, 'Unknown Vehicle') AS source_name,
  fl.vehicle_id,
  fl.driver_id,
  fl.log_date AS fuel_date,
  fl.gallons_purchased AS gallons,
  fl.total_cost AS cost,
  fl.cost_per_gallon,
  fl.odometer_reading,
  fl.fuel_type::text,
  fl.notes,
  fl.fuel_station_id AS vendor_id,
  fl.fuel_tank_id AS tank_id,
  fl.created_at
FROM fuel_logs fl
LEFT JOIN vehicles v ON v.id = fl.vehicle_id

UNION ALL

-- Yard tank deliveries from fuel_tank_deliveries table
SELECT 
  ftd.id::text AS reference_id,
  'yard_tank'::text AS source_type,
  COALESCE(ft.tank_name, 'Unknown Tank') AS source_name,
  NULL::uuid AS vehicle_id,
  NULL::text AS driver_id,
  ftd.delivery_date AS fuel_date,
  ftd.gallons_delivered AS gallons,
  ftd.total_cost AS cost,
  ftd.cost_per_gallon,
  NULL::integer AS odometer_reading,
  ft.fuel_type::text,
  ftd.notes,
  NULL::uuid AS vendor_id,
  ftd.tank_id,
  ftd.created_at
FROM fuel_tank_deliveries ftd
LEFT JOIN fuel_tanks ft ON ft.id = ftd.tank_id

UNION ALL

-- Mobile fuel service - individual vehicle records
SELECT 
  mfsv.id::text AS reference_id,
  'mobile_service'::text AS source_type,
  COALESCE(mfv.vendor_name, 'Unknown Vendor') AS source_name,
  mfsv.vehicle_id,
  NULL::text AS driver_id,
  mfs.service_date AS fuel_date,
  mfsv.gallons_dispensed AS gallons,
  (mfsv.gallons_dispensed * mfs.cost_per_gallon) AS cost,
  mfs.cost_per_gallon,
  mfsv.odometer_reading,
  mfs.fuel_grade AS fuel_type,
  mfsv.vehicle_notes AS notes,
  mfs.vendor_id,
  NULL::uuid AS tank_id,
  mfsv.created_at
FROM mobile_fuel_service_vehicles mfsv
INNER JOIN mobile_fuel_services mfs ON mfs.id = mfsv.service_id
LEFT JOIN mobile_fuel_vendors mfv ON mfv.id = mfs.vendor_id

UNION ALL

-- Mobile fuel service - aggregate records (when no individual vehicle breakdown)
SELECT 
  mfs.id::text AS reference_id,
  'mobile_service'::text AS source_type,
  COALESCE(mfv.vendor_name, 'Unknown Vendor') AS source_name,
  NULL::uuid AS vehicle_id,
  NULL::text AS driver_id,
  mfs.service_date AS fuel_date,
  mfs.total_gallons AS gallons,
  mfs.total_cost AS cost,
  mfs.cost_per_gallon,
  NULL::integer AS odometer_reading,
  mfs.fuel_grade AS fuel_type,
  mfs.notes,
  mfs.vendor_id,
  NULL::uuid AS tank_id,
  mfs.created_at
FROM mobile_fuel_services mfs
LEFT JOIN mobile_fuel_vendors mfv ON mfv.id = mfs.vendor_id
WHERE NOT EXISTS (
  -- Only include if there are no individual vehicle records
  SELECT 1 FROM mobile_fuel_service_vehicles mfsv 
  WHERE mfsv.service_id = mfs.id
);