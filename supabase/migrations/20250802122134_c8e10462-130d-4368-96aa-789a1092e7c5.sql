-- Fix ABC Carnival location by adding GPS coordinates
-- Address: 19201 Bagley Dr, Middleburg Heights, OH, 44130
-- GPS coordinates for this address: (-81.81659, 41.36749)

UPDATE customer_service_locations 
SET gps_coordinates = point(-81.81659, 41.36749)
WHERE customer_id = 'f02f1df3-5fe6-4fde-a3d2-04753e3652a4' 
  AND location_name = 'ABC Carnival - Main Location';