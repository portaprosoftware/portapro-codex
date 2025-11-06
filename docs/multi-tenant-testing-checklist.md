# Multi-Tenant Testing Checklist

## Phase 6E: Manual Testing Procedures

This checklist ensures complete multi-tenant data isolation is working correctly across the entire PortaPro application.

---

## Prerequisites

- [ ] SQL migration applied from `docs/add_organization_id_migration.sql`
- [ ] Data cleanup completed (if using Option 1)
- [ ] All hooks updated with organization_id filtering (Phase 6B)
- [ ] All edge functions updated (Phase 6C)
- [ ] Validation SQL script run successfully from `docs/verify-multi-tenant-setup.sql`

---

## Part 1: Clerk Organization Setup

### Create Test Organizations

- [ ] Log into Clerk Dashboard: https://dashboard.clerk.com
- [ ] Navigate to Organizations
- [ ] Create Organization 1:
  - Name: "Test Company A"
  - Slug: `test-company-a`
  - Note the Organization ID (starts with `org_`)
- [ ] Create Organization 2:
  - Name: "Test Company B" 
  - Slug: `test-company-b`
  - Note the Organization ID

### Add Users to Organizations

- [ ] Create Test User 1:
  - Email: `admin-a@test.com`
  - Add to Organization 1 with role `org:owner`
- [ ] Create Test User 2:
  - Email: `admin-b@test.com`
  - Add to Organization 2 with role `org:owner`
- [ ] Create Test User 3:
  - Email: `driver-a@test.com`
  - Add to Organization 1 with role `org:driver`

---

## Part 2: Verify Profile Sync

### Check Supabase Profiles Table

- [ ] Open Supabase SQL Editor
- [ ] Run query:
  ```sql
  SELECT id, email, first_name, last_name, organization_id 
  FROM profiles 
  WHERE email IN ('admin-a@test.com', 'admin-b@test.com', 'driver-a@test.com');
  ```
- [ ] Verify each user has correct `organization_id` set
- [ ] Verify `organization_id` matches the Clerk Organization ID

**If NULL organization_id:**
- Log out and back in to trigger profile sync
- Check `profile_sync` edge function logs
- Verify `useClerkProfileSync` hook is active

---

## Part 3: Test Data Creation (Organization 1)

### Login as admin-a@test.com

- [ ] Navigate to Dashboard
- [ ] Verify organization context shows "Test Company A"

### Create Customer Data

- [ ] Navigate to Customers → Add Customer
- [ ] Create customer: "ABC Construction"
- [ ] Add service location
- [ ] Add contact
- [ ] Save customer
- [ ] Verify in Supabase:
  ```sql
  SELECT id, name, organization_id FROM customers WHERE name = 'ABC Construction';
  ```
- [ ] Confirm `organization_id` matches Organization 1

### Create Product Data

- [ ] Navigate to Inventory → Products → Add Product
- [ ] Create product: "Standard Porta Potty"
- [ ] Add product items (3 units)
- [ ] Save product
- [ ] Verify in Supabase:
  ```sql
  SELECT id, name, organization_id FROM products WHERE name = 'Standard Porta Potty';
  SELECT COUNT(*), organization_id FROM product_items 
  WHERE product_id = (SELECT id FROM products WHERE name = 'Standard Porta Potty')
  GROUP BY organization_id;
  ```
- [ ] Confirm all records have Organization 1 ID

### Create Job Data

- [ ] Navigate to Jobs → Create Job
- [ ] Select customer "ABC Construction"
- [ ] Add job items
- [ ] Set schedule
- [ ] Save job
- [ ] Verify in Supabase:
  ```sql
  SELECT id, job_number, organization_id FROM jobs 
  WHERE customer_id = (SELECT id FROM customers WHERE name = 'ABC Construction');
  
  SELECT COUNT(*), organization_id FROM job_items 
  WHERE job_id IN (SELECT id FROM jobs WHERE customer_id = (SELECT id FROM customers WHERE name = 'ABC Construction'))
  GROUP BY organization_id;
  ```
- [ ] Confirm job and all job_items have Organization 1 ID

### Create Vehicle & Fuel Data

- [ ] Navigate to Fleet → Add Vehicle
- [ ] Create vehicle: "Truck 101"
- [ ] Add fuel log entry
- [ ] Verify in Supabase:
  ```sql
  SELECT id, name, organization_id FROM vehicles WHERE name = 'Truck 101';
  SELECT COUNT(*), organization_id FROM fuel_logs 
  WHERE vehicle_id = (SELECT id FROM vehicles WHERE name = 'Truck 101')
  GROUP BY organization_id;
  ```

### Create Work Order

- [ ] Navigate to Maintenance → Work Orders → Create
- [ ] Create work order for vehicle
- [ ] Verify in Supabase:
  ```sql
  SELECT id, organization_id FROM work_orders LIMIT 5;
  ```

---

## Part 4: Test Data Creation (Organization 2)

### Login as admin-b@test.com

- [ ] Log out from Organization 1
- [ ] Log in as `admin-b@test.com`
- [ ] Verify organization context shows "Test Company B"

### Create Similar Data

- [ ] Create customer: "XYZ Events"
- [ ] Create product: "Deluxe Restroom Trailer"
- [ ] Add 2 product items
- [ ] Create job for XYZ Events
- [ ] Create vehicle: "Truck 201"
- [ ] Add fuel log

### Verify Separate Data in Supabase

- [ ] Run query:
  ```sql
  -- Should show 2 distinct organizations
  SELECT 
    organization_id,
    COUNT(DISTINCT id) as customer_count
  FROM customers
  GROUP BY organization_id;
  
  SELECT 
    organization_id,
    COUNT(DISTINCT id) as product_count
  FROM products
  GROUP BY organization_id;
  
  SELECT 
    organization_id,
    COUNT(DISTINCT id) as job_count
  FROM jobs
  GROUP BY organization_id;
  ```
- [ ] Confirm each organization has separate data

---

## Part 5: Test Data Isolation (Critical Security Test)

### Test Cross-Tenant Access Prevention

- [ ] While logged in as `admin-b@test.com` (Organization 2):
  - [ ] Navigate to Customers list
  - [ ] **VERIFY: Should NOT see "ABC Construction"** (Organization 1's customer)
  - [ ] Navigate to Jobs list
  - [ ] **VERIFY: Should NOT see jobs for ABC Construction**
  - [ ] Navigate to Products list
  - [ ] **VERIFY: Should NOT see "Standard Porta Potty"** (Organization 1's product)
  - [ ] Navigate to Fleet list
  - [ ] **VERIFY: Should NOT see "Truck 101"** (Organization 1's vehicle)

### Test Database-Level Isolation

- [ ] Run direct database query in Supabase:
  ```sql
  -- Get Organization 1 ID
  SELECT organization_id FROM customers WHERE name = 'ABC Construction' LIMIT 1;
  -- Save this as ORG_1_ID
  
  -- Get Organization 2 ID  
  SELECT organization_id FROM customers WHERE name = 'XYZ Events' LIMIT 1;
  -- Save this as ORG_2_ID
  
  -- Verify no data leakage
  SELECT 'customers' as table_name, COUNT(*) as org1_records 
  FROM customers WHERE organization_id = 'ORG_1_ID'
  UNION ALL
  SELECT 'customers', COUNT(*) FROM customers WHERE organization_id = 'ORG_2_ID';
  
  SELECT 'jobs' as table_name, COUNT(*) as org1_records 
  FROM jobs WHERE organization_id = 'ORG_1_ID'
  UNION ALL
  SELECT 'jobs', COUNT(*) FROM jobs WHERE organization_id = 'ORG_2_ID';
  ```
- [ ] **VERIFY: Each org has only their own data**
- [ ] **VERIFY: No records with NULL organization_id**

---

## Part 6: Test Role-Based Access

### Test Driver Role (Organization 1)

- [ ] Log out
- [ ] Log in as `driver-a@test.com`
- [ ] Verify can access:
  - [ ] Mobile work order view
  - [ ] Assigned jobs
  - [ ] Vehicle DVIR
- [ ] Verify CANNOT access:
  - [ ] Customer management
  - [ ] Invoice creation
  - [ ] Settings/Admin areas
- [ ] **VERIFY: Only sees Organization 1 data**

---

## Part 7: Test Edge Functions

### Test Bulk Reminders

- [ ] Login as `admin-a@test.com` (Organization 1)
- [ ] Navigate to a feature that sends bulk reminders
- [ ] Send reminder to driver
- [ ] Verify in Supabase:
  ```sql
  SELECT organization_id, type, customer_id 
  FROM customer_communications 
  ORDER BY created_at DESC LIMIT 5;
  
  SELECT organization_id, driver_id, action_type 
  FROM driver_activity_log 
  ORDER BY created_at DESC LIMIT 5;
  ```
- [ ] **VERIFY: All records have Organization 1 ID**

### Test User Invitation

- [ ] While logged in as `admin-a@test.com`
- [ ] Invite new user to Organization 1
- [ ] Check Supabase:
  ```sql
  SELECT organization_id, email, role 
  FROM user_invitations 
  ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] **VERIFY: Invitation has correct organization_id**

---

## Part 8: Performance Testing

### Test Query Performance with Indexes

- [ ] Run explain analyze on common queries:
  ```sql
  EXPLAIN ANALYZE
  SELECT * FROM jobs 
  WHERE organization_id = 'ORG_1_ID' 
  ORDER BY created_at DESC 
  LIMIT 20;
  
  EXPLAIN ANALYZE
  SELECT * FROM customers 
  WHERE organization_id = 'ORG_1_ID'
  AND name ILIKE '%ABC%';
  ```
- [ ] **VERIFY: Query plan shows "Index Scan" on organization_id**
- [ ] **VERIFY: Query execution time < 50ms**

---

## Part 9: Final Validation

### Run Complete Validation Script

- [ ] Open Supabase SQL Editor
- [ ] Run entire script from `docs/verify-multi-tenant-setup.sql`
- [ ] Review all check results:
  - [ ] CHECK 1: No tables missing organization_id ✅
  - [ ] CHECK 2: All tables have organization_id index ✅
  - [ ] CHECK 3: Zero NULL organization_id values ✅
  - [ ] CHECK 4: Table audit shows all tables configured ✅
  - [ ] CHECK 5: Multiple organizations have data ✅
  - [ ] CHECK 6: Data isolation confirmed ✅
  - [ ] CHECK 7: No orphaned records ✅
  - [ ] CHECK 8: Indexes are being used ✅
  - [ ] CHECK 9: Summary shows "MULTI-TENANT SETUP COMPLETE" ✅

---

## Part 10: Production Readiness Checklist

### Code Review

- [ ] All hooks use `useOrganizationId()` hook
- [ ] All SELECT queries filter by `.eq('organization_id', orgId)`
- [ ] All INSERT operations include `organization_id: orgId`
- [ ] All edge functions accept and validate `organizationId`
- [ ] No hard-coded organization IDs anywhere

### Documentation

- [ ] `docs/multi-tenant-deployment.md` is up to date
- [ ] Environment variable requirements documented
- [ ] Deployment process documented
- [ ] Testing procedures documented (this file)

### Security Verification

- [ ] RLS policies will be added (Phase 7 - future)
- [ ] No cross-tenant data leakage confirmed
- [ ] All database queries scoped by organization_id
- [ ] Edge functions validate organization membership

### Monitoring Setup

- [ ] Set up alerts for NULL organization_id insertions
- [ ] Monitor cross-tenant query attempts
- [ ] Track organization data growth
- [ ] Set up backup procedures per organization

---

## Success Criteria

✅ **All tests must pass before production deployment:**

1. Data Isolation: Users in Org A cannot see Org B's data
2. Database Level: All tables have organization_id with indexes
3. Application Level: All hooks filter by organization_id
4. Edge Functions: All include organization_id in operations
5. No NULL Values: Zero NULL organization_id in any table
6. Performance: Queries use indexes efficiently
7. Roles: Permission system works correctly
8. Validation: All automated checks pass

---

## Troubleshooting

### Issue: NULL organization_id values found

**Solution:**
1. Check if user's profile has organization_id set
2. Verify Clerk organization membership
3. Re-login to trigger profile sync
4. Check `useOrganizationId` hook returns valid orgId

### Issue: User sees data from wrong organization

**Solution:**
1. Verify organization_id in profiles table matches Clerk
2. Check if hook is filtering by correct orgId
3. Inspect Supabase query in browser DevTools
4. Verify no caching issues

### Issue: Query performance slow

**Solution:**
1. Run EXPLAIN ANALYZE to check if index used
2. Verify indexes exist: `SELECT * FROM pg_indexes WHERE tablename = 'table_name';`
3. Re-run migration to create missing indexes
4. Consider composite indexes for common query patterns

---

## Sign-Off

**Tested by:** _________________  
**Date:** _________________  
**Organization 1 ID:** _________________  
**Organization 2 ID:** _________________  
**All Tests Passed:** ☐ Yes ☐ No  
**Production Ready:** ☐ Yes ☐ No  

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
