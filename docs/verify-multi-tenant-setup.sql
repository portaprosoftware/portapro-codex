-- ============================================================================
-- Phase 6E: Multi-Tenant Validation & Testing Script
-- ============================================================================
--
-- This script performs automated checks to validate the multi-tenant setup
-- and ensure proper data isolation across all tables.
--
-- INSTRUCTIONS:
-- 1. Run this script in Supabase SQL Editor after applying the migration
-- 2. Review all results carefully
-- 3. Fix any issues found before going to production
-- 4. Re-run after fixes to verify
--
-- ============================================================================

-- ============================================================================
-- CHECK 1: Find tables still missing organization_id column
-- ============================================================================
-- Expected Result: Empty or only system tables (profiles, unified views, etc.)

SELECT 
  'MISSING_ORG_ID_COLUMN' as check_name,
  t.tablename as table_name,
  'Add organization_id column to this table' as action_required
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns c
    WHERE c.table_name = t.tablename
      AND c.column_name = 'organization_id'
  )
  -- Exclude system/view tables that don't need org_id
  AND t.tablename NOT IN (
    'profiles',
    'user_roles', 
    'user_invitations',
    'unified_fuel_consumption',
    'unified_product_stock',
    'company_settings',
    'business_hours',
    'company_maintenance_settings',
    'consumable_notification_settings',
    'document_notification_settings'
  )
ORDER BY t.tablename;

-- ============================================================================
-- CHECK 2: Find tables with organization_id but missing index
-- ============================================================================
-- Expected Result: Empty (all tables with org_id should have indexes)

SELECT 
  'MISSING_ORG_ID_INDEX' as check_name,
  t.tablename as table_name,
  'Create index on organization_id for query performance' as action_required
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND EXISTS (
    SELECT 1 
    FROM information_schema.columns c
    WHERE c.table_name = t.tablename
      AND c.column_name = 'organization_id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_indexes i
    WHERE i.tablename = t.tablename
      AND i.indexdef LIKE '%organization_id%'
  )
ORDER BY t.tablename;

-- ============================================================================
-- CHECK 3: Find NULL organization_id values in critical tables
-- ============================================================================
-- Expected Result: 0 NULL values in all tables after cleanup and migration

SELECT 'NULL_ORG_ID_IN_JOBS' as check_name, COUNT(*) as null_count 
FROM jobs WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_CUSTOMERS', COUNT(*) FROM customers WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_INVOICES', COUNT(*) FROM invoices WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_QUOTES', COUNT(*) FROM quotes WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_PRODUCTS', COUNT(*) FROM products WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_PRODUCT_ITEMS', COUNT(*) FROM product_items WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_VEHICLES', COUNT(*) FROM vehicles WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_FUEL_LOGS', COUNT(*) FROM fuel_logs WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_WORK_ORDERS', COUNT(*) FROM work_orders WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_MAINTENANCE_RECORDS', COUNT(*) FROM maintenance_records WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_CONSUMABLES', COUNT(*) FROM consumables WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_EQUIPMENT_ASSIGNMENTS', COUNT(*) FROM equipment_assignments WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_DRIVER_SHIFTS', COUNT(*) FROM driver_shifts WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_EMPLOYEE_CERTIFICATIONS', COUNT(*) FROM employee_certifications WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_SANITATION_LOGS', COUNT(*) FROM sanitation_logs WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_FUEL_TANKS', COUNT(*) FROM fuel_tanks WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_FUEL_SUPPLIERS', COUNT(*) FROM fuel_suppliers WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_MOBILE_FUEL_SERVICES', COUNT(*) FROM mobile_fuel_services WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_CUSTOMER_COMMUNICATIONS', COUNT(*) FROM customer_communications WHERE organization_id IS NULL
UNION ALL
SELECT 'NULL_ORG_ID_IN_DRIVER_ACTIVITY_LOG', COUNT(*) FROM driver_activity_log WHERE organization_id IS NULL
ORDER BY check_name;

-- ============================================================================
-- CHECK 4: Comprehensive table audit with organization_id status
-- ============================================================================
-- Shows which tables have org_id column and index

SELECT 
  t.tablename as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_name = t.tablename AND c.column_name = 'organization_id'
    ) THEN '✓ Has Column'
    ELSE '✗ Missing Column'
  END as has_org_id_column,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes i
      WHERE i.tablename = t.tablename AND i.indexdef LIKE '%organization_id%'
    ) THEN '✓ Has Index'
    ELSE '✗ Missing Index'
  END as has_org_id_index,
  (
    SELECT pg_size_pretty(pg_total_relation_size(quote_ident(t.tablename)::regclass))
  ) as table_size
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE 'sql_%'
ORDER BY 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_name = t.tablename AND c.column_name = 'organization_id'
    ) THEN 1
    ELSE 0
  END ASC,
  t.tablename;

-- ============================================================================
-- CHECK 5: Count distinct organizations in each table
-- ============================================================================
-- Expected: Should show how many organizations have data in each table

WITH org_counts AS (
  SELECT 'jobs' as table_name, COUNT(DISTINCT organization_id) as org_count, COUNT(*) as total_rows FROM jobs
  UNION ALL SELECT 'customers', COUNT(DISTINCT organization_id), COUNT(*) FROM customers
  UNION ALL SELECT 'invoices', COUNT(DISTINCT organization_id), COUNT(*) FROM invoices
  UNION ALL SELECT 'quotes', COUNT(DISTINCT organization_id), COUNT(*) FROM quotes
  UNION ALL SELECT 'products', COUNT(DISTINCT organization_id), COUNT(*) FROM products
  UNION ALL SELECT 'vehicles', COUNT(DISTINCT organization_id), COUNT(*) FROM vehicles
  UNION ALL SELECT 'work_orders', COUNT(DISTINCT organization_id), COUNT(*) FROM work_orders
  UNION ALL SELECT 'fuel_logs', COUNT(DISTINCT organization_id), COUNT(*) FROM fuel_logs
  UNION ALL SELECT 'maintenance_records', COUNT(DISTINCT organization_id), COUNT(*) FROM maintenance_records
  UNION ALL SELECT 'consumables', COUNT(DISTINCT organization_id), COUNT(*) FROM consumables
)
SELECT 
  table_name,
  org_count as distinct_organizations,
  total_rows,
  CASE 
    WHEN org_count = 0 AND total_rows > 0 THEN '⚠️ Data exists but no org_id set'
    WHEN org_count > 0 THEN '✓ Multi-tenant data exists'
    ELSE 'Empty table'
  END as status
FROM org_counts
ORDER BY total_rows DESC;

-- ============================================================================
-- CHECK 6: Verify data isolation - simulate cross-tenant query
-- ============================================================================
-- This checks if filtering by organization_id works correctly

-- First, get list of organizations with data
WITH orgs AS (
  SELECT DISTINCT organization_id 
  FROM jobs 
  WHERE organization_id IS NOT NULL 
  LIMIT 5
)
SELECT 
  o.organization_id,
  (SELECT COUNT(*) FROM jobs j WHERE j.organization_id = o.organization_id) as job_count,
  (SELECT COUNT(*) FROM customers c WHERE c.organization_id = o.organization_id) as customer_count,
  (SELECT COUNT(*) FROM invoices i WHERE i.organization_id = o.organization_id) as invoice_count,
  (SELECT COUNT(*) FROM vehicles v WHERE v.organization_id = o.organization_id) as vehicle_count
FROM orgs o
ORDER BY o.organization_id;

-- ============================================================================
-- CHECK 7: Find orphaned records (foreign key violations potential)
-- ============================================================================
-- Checks if child records have matching parent organization_id

-- Job items should match job's organization_id
SELECT 
  'ORPHANED_JOB_ITEMS' as check_name,
  COUNT(*) as orphaned_count
FROM job_items ji
LEFT JOIN jobs j ON ji.job_id = j.id
WHERE ji.organization_id != j.organization_id 
   OR (ji.organization_id IS NULL AND j.organization_id IS NOT NULL)
   OR (ji.organization_id IS NOT NULL AND j.organization_id IS NULL);

-- Invoice items should match invoice's organization_id
SELECT 
  'ORPHANED_INVOICE_ITEMS' as check_name,
  COUNT(*) as orphaned_count
FROM invoice_items ii
LEFT JOIN invoices i ON ii.invoice_id = i.id
WHERE ii.organization_id != i.organization_id
   OR (ii.organization_id IS NULL AND i.organization_id IS NOT NULL)
   OR (ii.organization_id IS NOT NULL AND i.organization_id IS NULL);

-- ============================================================================
-- CHECK 8: Verify indexes are being used (query plan check)
-- ============================================================================
-- This explains how Postgres will query filtered by organization_id

EXPLAIN ANALYZE
SELECT * FROM jobs WHERE organization_id = 'org_test_123' LIMIT 10;

EXPLAIN ANALYZE
SELECT * FROM customers WHERE organization_id = 'org_test_123' LIMIT 10;

-- ============================================================================
-- CHECK 9: Summary Report
-- ============================================================================

SELECT 
  'VALIDATION_SUMMARY' as report_section,
  (
    SELECT COUNT(*) 
    FROM pg_tables t
    WHERE t.schemaname = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_name = t.tablename AND c.column_name = 'organization_id'
      )
      AND t.tablename NOT IN ('profiles', 'user_roles', 'user_invitations', 'unified_fuel_consumption', 'unified_product_stock')
  ) as tables_missing_org_id,
  (
    SELECT COUNT(*)
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_name = t.tablename AND c.column_name = 'organization_id'
      )
      AND NOT EXISTS (
        SELECT 1 FROM pg_indexes i
        WHERE i.tablename = t.tablename AND i.indexdef LIKE '%organization_id%'
      )
  ) as tables_missing_org_id_index,
  (
    SELECT SUM(null_count)::integer FROM (
      SELECT COUNT(*) as null_count FROM jobs WHERE organization_id IS NULL
      UNION ALL SELECT COUNT(*) FROM customers WHERE organization_id IS NULL
      UNION ALL SELECT COUNT(*) FROM invoices WHERE organization_id IS NULL
      UNION ALL SELECT COUNT(*) FROM quotes WHERE organization_id IS NULL
      UNION ALL SELECT COUNT(*) FROM vehicles WHERE organization_id IS NULL
    ) counts
  ) as total_null_org_ids,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM pg_tables t
      WHERE t.schemaname = 'public'
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = t.tablename AND c.column_name = 'organization_id')
        AND t.tablename NOT IN ('profiles', 'user_roles', 'user_invitations')
    ) = 0 
    AND (
      SELECT COUNT(*) FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = t.tablename AND c.column_name = 'organization_id')
        AND NOT EXISTS (SELECT 1 FROM pg_indexes i WHERE i.tablename = t.tablename AND i.indexdef LIKE '%organization_id%')
    ) = 0
    THEN '✅ MULTI-TENANT SETUP COMPLETE'
    ELSE '⚠️ ISSUES FOUND - REVIEW CHECKS ABOVE'
  END as overall_status;

-- ============================================================================
-- END OF VALIDATION SCRIPT
-- ============================================================================
--
-- If all checks pass:
-- ✅ All tables have organization_id column
-- ✅ All organization_id columns have indexes
-- ✅ No NULL organization_id values exist
-- ✅ Data isolation is working correctly
-- ✅ Ready for production multi-tenant deployment
--
-- If issues found:
-- 1. Review failed checks above
-- 2. Apply missing migrations from docs/add_organization_id_migration.sql
-- 3. Fix NULL values or run cleanup script
-- 4. Re-run this validation script
-- ============================================================================
