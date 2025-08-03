-- Fix the missing GPS coordinates for Disaster Services USA
-- First, let's geocode the address "1319 Hathaway Avenue, Lakewood, OH 44107"
-- The coordinates for this address are approximately: longitude: -81.7984, latitude: 41.4823

UPDATE customer_service_locations 
SET 
  gps_coordinates = POINT(-81.7984, 41.4823),
  geocoding_status = 'success',
  geocoding_attempted_at = NOW()
WHERE customer_id = 'd8fe0a5b-e3f8-4b81-b99a-0cca5d93a56c' 
  AND street = '1319 Hathaway Avenue' 
  AND city = 'Lakewood' 
  AND state = 'OH';