-- Fix Hotels.com coordinates and any other incorrectly formatted coordinates
UPDATE customer_service_locations 
SET gps_coordinates = 'POINT(-81.6954 41.4993)'
WHERE customer_id = '95ddb3eb-b4f3-4797-8579-fad2b85094f6' 
AND street = 'Address: 1111 W 10th St';

-- Fix any other coordinates that may have the wrong format
UPDATE customer_service_locations 
SET gps_coordinates = 'POINT(-81.7981 41.4822)'
WHERE customer_id = 'd8fe0a5b-e3f8-4b81-b99a-0cca5d93a56c' 
AND street = '1319 Hathaway Avenue';

UPDATE customer_service_locations 
SET gps_coordinates = 'POINT(-81.3707 41.3149)'
WHERE street = '410 Blair Circle';

UPDATE customer_service_locations 
SET gps_coordinates = 'POINT(-81.7006 41.5031)'
WHERE street = '6500 Cleveland Memorial Shoreway';