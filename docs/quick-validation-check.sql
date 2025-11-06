-- Quick Validation Check - Run this in Supabase SQL Editor
-- This provides a summary of the multi-tenant setup status

-- 1. Count tables with organization_id column
SELECT 
  'Tables with organization_id' as metric,
  COUNT(*) as count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'organization_id';

-- 2. Count indexes on organization_id
SELECT 
  'Indexes on organization_id' as metric,
  COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexdef LIKE '%organization_id%';

-- 3. Check for any NULL organization_id values in key tables
SELECT 
  'jobs with NULL org_id' as metric,
  COUNT(*) as count
FROM jobs 
WHERE organization_id IS NULL
UNION ALL
SELECT 
  'customers with NULL org_id',
  COUNT(*)
FROM customers 
WHERE organization_id IS NULL
UNION ALL
SELECT 
  'products with NULL org_id',
  COUNT(*)
FROM products 
WHERE organization_id IS NULL;

-- 4. List all tables missing organization_id (should be empty or only system tables)
SELECT 
  'Missing organization_id' as status,
  t.tablename
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns c
    WHERE c.table_name = t.tablename
      AND c.column_name = 'organization_id'
  )
  AND t.tablename NOT IN (
    'profiles',
    'user_roles',
    'user_invitations',
    'unified_fuel_consumption',
    'unified_product_stock'
  )
ORDER BY t.tablename;

-- 5. Overall status
SELECT 
  '✅ MIGRATION STATUS' as summary,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM pg_tables t
      WHERE t.schemaname = 'public'
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = t.tablename AND c.column_name = 'organization_id')
        AND t.tablename NOT IN ('profiles', 'user_roles', 'user_invitations', 'unified_fuel_consumption', 'unified_product_stock')
    ) = 0 
    THEN 'ALL TABLES HAVE organization_id COLUMN ✅'
    ELSE 'SOME TABLES MISSING organization_id ⚠️'
  END as column_status,
  CASE
    WHEN (
      SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexdef LIKE '%organization_id%'
    ) > 100
    THEN 'INDEXES CREATED ✅'
    ELSE 'MISSING SOME INDEXES ⚠️'
  END as index_status;
