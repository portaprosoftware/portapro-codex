-- Phase 1: Data Migration & Cleanup

-- 1. Clean up inconsistent individual items that have location text but no proper storage_location_id
UPDATE product_items 
SET current_storage_location_id = NULL, 
    location = NULL,
    status = 'available'
WHERE current_storage_location_id IS NULL 
   OR location IS NOT NULL;

-- 2. Remove any orphaned product items that don't have valid products
DELETE FROM product_items 
WHERE product_id NOT IN (SELECT id FROM products);

-- 3. Ensure all products have proper default storage locations
UPDATE products 
SET default_storage_location_id = (
  SELECT id FROM storage_locations 
  WHERE is_default = true 
  LIMIT 1
)
WHERE default_storage_location_id IS NULL;