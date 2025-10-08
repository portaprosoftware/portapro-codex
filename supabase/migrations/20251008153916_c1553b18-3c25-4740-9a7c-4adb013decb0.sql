CREATE OR REPLACE VIEW public.unified_fuel_consumption AS 
SELECT 
  fl.id AS reference_id,
  'retail'::text AS source_type,
  COALESCE(fl.fuel_station, 'Unknown Station'::text) AS source_name,
  fl.vehicle_id,
  fl.driver_id,
  fl.log_date AS fuel_date,
  fl.gallons_purchased AS gallons,
  fl.total_cost AS cost,
  fl.cost_per_gallon,
  fl.odometer_reading,
  (fl.fuel_type)::text AS fuel_type,
  fl.notes,
  NULL::uuid AS vendor_id,
  NULL::uuid AS tank_id,
  fl.created_at
FROM fuel_logs fl
WHERE (fl.fuel_source)::text = 'retail_station'::text
UNION ALL
SELECT 
  fl.id AS reference_id,
  'yard_tank'::text AS source_type,
  COALESCE((SELECT ft.tank_name FROM fuel_tanks ft WHERE ft.id = fl.fuel_tank_id), 'Unknown Tank'::text) AS source_name,
  fl.vehicle_id,
  fl.driver_id,
  fl.log_date AS fuel_date,
  fl.gallons_purchased AS gallons,
  fl.total_cost AS cost,
  fl.cost_per_gallon,
  fl.odometer_reading,
  (fl.fuel_type)::text AS fuel_type,
  fl.notes,
  NULL::uuid AS vendor_id,
  fl.fuel_tank_id AS tank_id,
  fl.created_at
FROM fuel_logs fl
WHERE (fl.fuel_source)::text = 'yard_tank'::text
UNION ALL
SELECT 
  mfsv.id AS reference_id,
  'mobile_service'::text AS source_type,
  COALESCE(mfv.vendor_name, 'Unknown Vendor'::text) AS source_name,
  mfsv.vehicle_id,
  NULL::text AS driver_id,
  mfs.service_date AS fuel_date,
  mfsv.gallons_dispensed AS gallons,
  CASE WHEN mfs.total_gallons > 0 THEN (mfs.total_cost / mfs.total_gallons) * mfsv.gallons_dispensed ELSE 0 END AS cost,
  mfs.price_per_gallon AS cost_per_gallon,
  mfsv.odometer_reading,
  mfs.fuel_grade AS fuel_type,
  COALESCE(mfsv.vehicle_notes, mfs.notes) AS notes,
  mfs.vendor_id,
  NULL::uuid AS tank_id,
  mfsv.created_at
FROM mobile_fuel_service_vehicles mfsv
JOIN mobile_fuel_services mfs ON mfs.id = mfsv.service_id
LEFT JOIN mobile_fuel_vendors mfv ON mfv.id = mfs.vendor_id;