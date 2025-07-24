-- Fix the placeholder pin with Kansas coordinates by updating it to match the customer's actual location
UPDATE service_location_coordinates 
SET 
  latitude = 41.36749,
  longitude = -81.83824,
  description = 'Updated from placeholder location',
  updated_at = now()
WHERE latitude = 39.8283 AND longitude = -98.5795;

-- Ensure all service locations have valid GPS coordinates where addresses exist
UPDATE customer_service_locations 
SET gps_coordinates = point(-81.83824, 41.36749)
WHERE id = 'a1a523e8-9299-4322-9eb8-65a222ae706d' 
  AND gps_coordinates IS NULL;