# Multi-Tenant Testing Guide for PortaPro

## Quick Start

As an AI, I cannot perform manual end-to-end testing that requires:
- Creating actual Clerk organizations
- Signing up real users
- Clicking through the UI
- Inspecting live database data

However, here's what **you need to do** to complete testing:

---

## Step 1: Automated Pre-Flight Checks

Run the automated verification script first to catch common issues:

```bash
# Set environment variables
export VITE_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run automated checks
npx tsx docs/automated-multi-tenant-verification.ts
```

This will verify:
- ✅ All tables have `organization_id` column
- ✅ No NULL `organization_id` values exist
- ✅ Indexes are properly configured
- ✅ Data distribution across organizations
- ✅ Edge functions are identified

---

## Step 2: Manual Testing (Required)

Follow the complete checklist in `docs/multi-tenant-testing-checklist.md`:

### Critical Tests You Must Perform:

1. **Create 2 Test Organizations in Clerk**
   - Organization A: "Test Company A" 
   - Organization B: "Test Company B"

2. **Add Test Users**
   - admin-a@test.com → Organization A (owner role)
   - admin-b@test.com → Organization B (owner role)
   - driver-a@test.com → Organization A (driver role)

3. **Create Test Data in Each Organization**
   - Customers
   - Products & Inventory
   - Jobs
   - Vehicles & Fuel Logs
   - Work Orders

4. **Verify Data Isolation (CRITICAL)**
   - Log in as admin-a@test.com
   - You should ONLY see Organization A's data
   - Log in as admin-b@test.com
   - You should ONLY see Organization B's data
   - If you see data from both orgs → **SECURITY ISSUE**

5. **Database Verification**
   Run these queries in Supabase SQL Editor:
   
   ```sql
   -- Check for NULL organization_id (should be ZERO)
   SELECT 
     'customers' as table_name, 
     COUNT(*) as null_count
   FROM customers 
   WHERE organization_id IS NULL
   UNION ALL
   SELECT 'jobs', COUNT(*) FROM jobs WHERE organization_id IS NULL
   UNION ALL
   SELECT 'products', COUNT(*) FROM products WHERE organization_id IS NULL;
   
   -- Verify data separation
   SELECT 
     organization_id,
     COUNT(*) as record_count
   FROM customers
   GROUP BY organization_id;
   ```

---

## Step 3: Code Review Checklist

Verify all code follows multi-tenant patterns:

### ✅ All React Hooks Must:
- Import `useOrganizationId()` hook
- Filter queries with `.eq('organization_id', orgId)`
- Pass `orgId` to all RPC function calls
- Include organization context in error logs

### ✅ All Edge Functions Must:
- Accept `organizationId` in request body
- Call `verifyOrganization(clerkUserId, organizationId)`
- Scope all queries to the organization

### ✅ All Database Operations Must:
- Include `organization_id` in INSERT statements
- Filter SELECT queries by `organization_id`
- Never allow NULL `organization_id`

---

## Step 4: Performance Testing

Run EXPLAIN ANALYZE on common queries:

```sql
-- Check if indexes are being used
EXPLAIN ANALYZE
SELECT * FROM jobs 
WHERE organization_id = 'your-org-id-here' 
ORDER BY created_at DESC 
LIMIT 20;

-- Should show "Index Scan using idx_jobs_organization_id"
-- Execution time should be < 50ms
```

---

## Step 5: Security Validation

### Run SQL Validation Script:

```sql
-- Copy and run: docs/multi-tenant-migration.sql validation section
-- This will check all tables, indexes, and data integrity
```

Expected output:
- ✅ CHECK 1: No tables missing organization_id
- ✅ CHECK 2: All tables have indexes
- ✅ CHECK 3: Zero NULL values
- ✅ CHECK 4-9: All checks pass

---

## Step 6: Production Readiness

Before deploying to production, confirm:

- [ ] All automated checks pass
- [ ] Manual testing completed without issues
- [ ] Data isolation verified (users can't see other org's data)
- [ ] Performance is acceptable (< 50ms for filtered queries)
- [ ] No NULL organization_id values in any table
- [ ] All edge functions validated with organization membership
- [ ] Environment variables documented and deployed
- [ ] Monitoring/alerts configured for multi-tenant issues

---

## Common Issues & Solutions

### Issue: User sees NULL organization_id

**Cause:** Profile sync didn't complete  
**Fix:** 
1. Check Supabase edge function logs for `profile_sync`
2. Verify Clerk organization membership
3. Log out and back in to trigger sync

### Issue: User sees another organization's data

**Cause:** Missing `.eq('organization_id', orgId)` filter  
**Fix:**
1. Search codebase for queries missing organization filter
2. Add `useOrganizationId()` hook to component
3. Update query with `.eq('organization_id', orgId)`

### Issue: Slow query performance

**Cause:** Missing index on organization_id  
**Fix:**
1. Run: `SELECT * FROM pg_indexes WHERE indexname LIKE '%organization%';`
2. If missing, run migration script to add indexes
3. Verify with EXPLAIN ANALYZE

---

## Test Sign-Off Template

**Tester:** _________________  
**Date:** _________________  
**Environment:** [ ] Staging [ ] Production  

**Test Results:**
- [ ] Automated checks: PASS
- [ ] Data isolation: PASS  
- [ ] Performance: PASS
- [ ] Security: PASS

**Organizations Tested:**
- Organization A ID: _________________
- Organization B ID: _________________

**Production Ready:** [ ] YES [ ] NO

**Issues Found:** _________________

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Update `.env.example` with required variables
2. ✅ Deploy to Vercel with environment variables configured
3. ✅ Set up monitoring alerts for NULL organization_id
4. ✅ Document deployment process
5. ✅ Train team on multi-tenant architecture

For questions, see: `docs/multi-tenant-deployment.md`
