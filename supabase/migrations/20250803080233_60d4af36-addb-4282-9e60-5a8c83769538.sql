-- Add GPS coordinates for 123 Construction's main location
UPDATE customer_service_locations 
SET gps_coordinates = POINT(-81.83824, 41.36749)
WHERE location_name = '123 Construction - Main Location' 
AND customer_id = '5adf772b-cd6e-4a7d-b2ef-7afc3c74a332';