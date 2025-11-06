-- PortaPro Multi-Tenant Data Migration Script
-- Use this script to backfill organization_id for existing data
-- when migrating to multi-tenant architecture

-- ⚠️ WARNING: This script should be run ONCE per organization during migration
-- ⚠️ Replace 'org_XXXXXXXX' with the actual Clerk organization ID

-- ====================
-- Step 1: Verify Organization ID
-- ====================

-- Get the Clerk organization ID from Clerk dashboard
-- Format: org_2abc123xyz (starts with 'org_')
DO $$
BEGIN
  RAISE NOTICE 'Replace org_XXXXXXXX with your actual Clerk organization ID before running!';
END $$;

-- ====================
-- Step 2: Backup Existing Data (Recommended)
-- ====================

-- Create backup tables (uncomment if needed)
-- CREATE TABLE jobs_backup AS SELECT * FROM jobs;
-- CREATE TABLE customers_backup AS SELECT * FROM customers;
-- CREATE TABLE products_backup AS SELECT * FROM products;

-- ====================
-- Step 3: Update Core Tables
-- ====================

-- Update Jobs
UPDATE jobs 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Customers
UPDATE customers 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Customer Contacts
UPDATE customer_contacts 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Customer Service Locations
UPDATE customer_service_locations 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- ====================
-- Step 4: Update Inventory Tables
-- ====================

-- Update Products
UPDATE products 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Product Items
UPDATE product_items 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Product Stock Ledger
UPDATE product_stock_ledger 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Stock Adjustments
UPDATE stock_adjustments 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- ====================
-- Step 5: Update Fleet Tables
-- ====================

-- Update Vehicles
UPDATE vehicles 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Fuel Logs
UPDATE fuel_logs 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Work Orders
UPDATE work_orders 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- ====================
-- Step 6: Update Financial Tables
-- ====================

-- Update Invoices
UPDATE invoices 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Invoice Items
UPDATE invoice_items 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Payments
UPDATE payments 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Quotes
UPDATE quotes 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Quote Items
UPDATE quote_items 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- ====================
-- Step 7: Update Job-Related Tables
-- ====================

-- Update Job Items
UPDATE job_items 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Job Consumables
UPDATE job_consumables 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Job Deliveries
UPDATE job_deliveries 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Job Pumps
UPDATE job_pumps 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Job Status History (if exists)
UPDATE job_status_history 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- ====================
-- Step 8: Update Settings & Configuration
-- ====================

-- Update Company Settings
UPDATE company_settings 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Pricing Tiers
UPDATE pricing_tiers 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- Update Service Areas
UPDATE service_areas 
SET organization_id = 'org_XXXXXXXX' 
WHERE organization_id IS NULL;

-- ====================
-- Step 9: Verification
-- ====================

-- Check for any remaining NULL organization_id values
SELECT 
  'jobs' as table_name, 
  COUNT(*) as null_org_count 
FROM jobs 
WHERE organization_id IS NULL

UNION ALL

SELECT 
  'customers', 
  COUNT(*) 
FROM customers 
WHERE organization_id IS NULL

UNION ALL

SELECT 
  'products', 
  COUNT(*) 
FROM products 
WHERE organization_id IS NULL

UNION ALL

SELECT 
  'vehicles', 
  COUNT(*) 
FROM vehicles 
WHERE organization_id IS NULL

UNION ALL

SELECT 
  'invoices', 
  COUNT(*) 
FROM invoices 
WHERE organization_id IS NULL;

-- Expected result: All counts should be 0

-- ====================
-- Step 10: Verify Organization ID is Consistent
-- ====================

-- Check that all records have the same organization_id
SELECT 
  organization_id, 
  COUNT(*) as record_count 
FROM (
  SELECT organization_id FROM jobs
  UNION ALL
  SELECT organization_id FROM customers
  UNION ALL
  SELECT organization_id FROM products
  UNION ALL
  SELECT organization_id FROM vehicles
  UNION ALL
  SELECT organization_id FROM invoices
) combined
GROUP BY organization_id
ORDER BY record_count DESC;

-- Expected result: Should see only 'org_XXXXXXXX' with all your records

-- ====================
-- Step 11: Optional - Add NOT NULL Constraints (After Verification)
-- ====================

-- Uncomment these after verifying all data has organization_id
-- This prevents future records from being created without organization_id

-- ALTER TABLE jobs ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE customers ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE products ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE vehicles ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE invoices ALTER COLUMN organization_id SET NOT NULL;

-- ====================
-- Step 12: Create Indexes (If Not Already Present)
-- ====================

-- These indexes improve query performance when filtering by organization_id
CREATE INDEX IF NOT EXISTS idx_jobs_organization_id ON jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_organization_id ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_items_organization_id ON product_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_organization_id ON vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_organization_id ON work_orders(organization_id);

-- ====================
-- Migration Complete!
-- ====================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete! Verify the results above.';
  RAISE NOTICE '📊 Run the verification queries to ensure all records have organization_id';
  RAISE NOTICE '🔒 After verification, consider adding NOT NULL constraints';
  RAISE NOTICE '🚀 Your database is now ready for multi-tenant operation!';
END $$;
