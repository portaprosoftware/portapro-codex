-- Clean up duplicate service locations for customers
-- This will remove duplicates while keeping the best one as default

WITH duplicate_locations AS (
  -- Find customers with multiple locations that have the same address
  SELECT 
    customer_id,
    COALESCE(street, '') as street_val,
    COALESCE(city, '') as city_val,
    COALESCE(state, '') as state_val,
    COALESCE(zip, '') as zip_val,
    COUNT(*) as location_count,
    MIN(created_at) as first_created,
    -- Keep the one that was created first or is marked as default
    (ARRAY_AGG(id ORDER BY 
      CASE WHEN is_default THEN 0 ELSE 1 END, 
      created_at ASC
    ))[1] as keep_id
  FROM public.customer_service_locations
  GROUP BY customer_id, 
           COALESCE(street, ''), 
           COALESCE(city, ''), 
           COALESCE(state, ''), 
           COALESCE(zip, '')
  HAVING COUNT(*) > 1
),
locations_to_delete AS (
  -- Get all the duplicate location IDs except the one we want to keep
  SELECT csl.id
  FROM public.customer_service_locations csl
  JOIN duplicate_locations dl ON csl.customer_id = dl.customer_id
    AND COALESCE(csl.street, '') = dl.street_val
    AND COALESCE(csl.city, '') = dl.city_val
    AND COALESCE(csl.state, '') = dl.state_val
    AND COALESCE(csl.zip, '') = dl.zip_val
  WHERE csl.id != dl.keep_id
)
-- Delete the duplicate locations
DELETE FROM public.customer_service_locations
WHERE id IN (SELECT id FROM locations_to_delete);

-- Ensure the remaining locations are properly set as default
UPDATE public.customer_service_locations
SET is_default = true
WHERE id IN (
  SELECT DISTINCT ON (customer_id) id
  FROM public.customer_service_locations
  ORDER BY customer_id, created_at ASC
)
AND customer_id IN (
  -- Only update customers who have no default location set
  SELECT customer_id 
  FROM public.customer_service_locations 
  GROUP BY customer_id 
  HAVING COUNT(*) FILTER (WHERE is_default = true) = 0
);