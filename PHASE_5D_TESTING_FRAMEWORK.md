# Phase 5D: Multi-Tenant Isolation Testing Framework

## 🎯 Overview
Complete end-to-end testing guide for validating multi-tenant data isolation in PortaPro after Phase 5A-5C security enhancements.

---

## 📊 Security Scan Results Summary

**Total Issues Found:** 472
- **CRITICAL**: Public exposure of PII (profiles, customers, contacts, locations)
- **HIGH**: Missing RLS on financial tables (invoices, payments)
- **MEDIUM**: Tables with RLS enabled but no policies

---

## ✅ Phase 5D Testing Checklist

### 1. Pre-Testing Setup

#### A. Create Test Organizations in Clerk
```bash
# Create 2 test organizations in Clerk Dashboard
Organization A: "test-org-alpha" (org_xxx123)
Organization B: "test-org-beta" (org_yyy456)

# Create test users for each org
User A1: test-alpha-owner@test.com (owner role in Org A)
User A2: test-alpha-admin@test.com (admin role in Org A)
User B1: test-beta-owner@test.com (owner role in Org B)
User B2: test-beta-admin@test.com (admin role in Org B)
```

#### B. Seed Test Data via SQL
```sql
-- Run this in Supabase SQL Editor to create test data

-- Create test customers for Org A
INSERT INTO public.customers (name, email, phone, organization_id)
VALUES 
  ('Alpha Customer 1', 'customer1@alpha.com', '555-0001', 'org_xxx123'),
  ('Alpha Customer 2', 'customer2@alpha.com', '555-0002', 'org_xxx123');

-- Create test customers for Org B
INSERT INTO public.customers (name, email, phone, organization_id)
VALUES 
  ('Beta Customer 1', 'customer1@beta.com', '555-0101', 'org_yyy456'),
  ('Beta Customer 2', 'customer2@beta.com', '555-0102', 'org_yyy456');

-- Create test jobs for Org A
INSERT INTO public.jobs (job_number, customer_id, status, organization_id)
SELECT 'ALPHA-001', id, 'assigned', 'org_xxx123' 
FROM public.customers WHERE email = 'customer1@alpha.com' LIMIT 1;

-- Create test jobs for Org B
INSERT INTO public.jobs (job_number, customer_id, status, organization_id)
SELECT 'BETA-001', id, 'assigned', 'org_yyy456' 
FROM public.customers WHERE email = 'customer1@beta.com' LIMIT 1;
```

---

### 2. Client-Side Hook Testing

#### Test 1: useCustomers Hook Isolation
```typescript
// Login as User A1 (Org A)
// Expected: See only Alpha customers (2 records)
// Expected: NOT see Beta customers (0 Beta records)

// Test Steps:
1. Login as test-alpha-owner@test.com
2. Navigate to Customers page
3. Open browser console
4. Run: localStorage.getItem('clerk-db-jwt')
5. Verify organization_id in JWT = 'org_xxx123'
6. Verify only Alpha customers are visible
7. Check network tab - verify API calls include .eq('organization_id', 'org_xxx123')

// Repeat for User B1
// Expected: See only Beta customers (2 records)
```

#### Test 2: useJobs Hook Isolation
```typescript
// Login as User A1 (Org A)
// Expected: See job 'ALPHA-001'
// Expected: NOT see job 'BETA-001'

// Login as User B1 (Org B)
// Expected: See job 'BETA-001'
// Expected: NOT see job 'ALPHA-001'
```

#### Test 3: useJobsWithDateRange Hook
```typescript
// Login as User A1
// Set date range to today
// Expected: Only Org A jobs in results
// Verify query has .eq('organization_id', 'org_xxx123')
```

#### Test 4: useProducts Hook
```typescript
// Create test products for each org via SQL:
INSERT INTO public.products (name, stock_total, organization_id)
VALUES 
  ('Alpha Product 1', 100, 'org_xxx123'),
  ('Beta Product 1', 50, 'org_yyy456');

// Login as User A1
// Expected: See only 'Alpha Product 1'
// Expected: NOT see 'Beta Product 1'
```

---

### 3. Edge Function Testing

#### Test 1: fleet-writes Edge Function
```bash
# Login as User A1, get JWT token
TOKEN_A1="<insert_clerk_jwt_for_user_a1>"

# Attempt to create fleet vehicle for Org A
curl -X POST https://kbqxyotasszslacozcey.supabase.co/functions/v1/fleet-writes \
  -H "Authorization: Bearer $TOKEN_A1" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "create",
    "organizationId": "org_xxx123",
    "data": {
      "license_plate": "ALPHA-001",
      "make": "Ford",
      "model": "Transit"
    }
  }'

# Expected: Success (201)

# Attempt to create fleet vehicle for Org B (should FAIL)
curl -X POST https://kbqxyotasszslacozcey.supabase.co/functions/v1/fleet-writes \
  -H "Authorization: Bearer $TOKEN_A1" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "create",
    "organizationId": "org_yyy456",
    "data": {
      "license_plate": "BETA-001",
      "make": "Ford",
      "model": "Transit"
    }
  }'

# Expected: 403 Forbidden - "User does not belong to organization"
```

#### Test 2: customer-docs Edge Function
```bash
# Login as User A1
# Attempt to upload document for Org A customer
curl -X POST https://kbqxyotasszslacozcey.supabase.co/functions/v1/customer-docs \
  -H "Authorization: Bearer $TOKEN_A1" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "upload",
    "organizationId": "org_xxx123",
    "customerId": "<alpha_customer_id>",
    "fileName": "contract.pdf",
    "fileData": "base64..."
  }'

# Expected: Success

# Attempt to upload document for Org B customer (should FAIL)
curl -X POST https://kbqxyotasszslacozcey.supabase.co/functions/v1/customer-docs \
  -H "Authorization: Bearer $TOKEN_A1" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "upload",
    "organizationId": "org_yyy456",
    "customerId": "<beta_customer_id>",
    "fileName": "contract.pdf",
    "fileData": "base64..."
  }'

# Expected: 403 Forbidden
```

---

### 4. RPC Function Testing

#### Test 1: add_job_note with Organization Validation
```sql
-- Login as User A1 via Supabase Studio
-- Get Job ID for ALPHA-001
SELECT id FROM public.jobs WHERE job_number = 'ALPHA-001';

-- Attempt to add note to Org A job (should succeed)
SELECT public.add_job_note(
  '<alpha_job_id>',
  '<user_a1_profile_id>',
  'Test note for Alpha job',
  'general',
  'org_xxx123'
);
-- Expected: Returns note_id (success)

-- Attempt to add note to Org B job using Org A token (should FAIL)
SELECT public.add_job_note(
  '<beta_job_id>',
  '<user_a1_profile_id>',
  'Attempting cross-org access',
  'general',
  'org_xxx123'  -- User A1 trying to access Org B job
);
-- Expected: ERROR - "Access denied: Job does not belong to organization"
```

#### Test 2: get_job_notes with Organization Validation
```sql
-- Get notes for Org A job (should succeed)
SELECT * FROM public.get_job_notes('<alpha_job_id>', 'org_xxx123');
-- Expected: Returns notes

-- Attempt to get notes for Org B job with Org A credentials (should FAIL)
SELECT * FROM public.get_job_notes('<beta_job_id>', 'org_xxx123');
-- Expected: ERROR - "Access denied: Job does not belong to organization"
```

#### Test 3: adjust_master_stock with Organization Validation
```sql
-- Get product ID for Alpha Product 1
SELECT id FROM public.products WHERE name = 'Alpha Product 1';

-- Adjust stock for Org A product (should succeed)
SELECT public.adjust_master_stock(
  '<alpha_product_id>',
  10,
  'Test stock adjustment',
  'Adding test inventory',
  'org_xxx123'
);
-- Expected: Returns success JSON

-- Attempt to adjust stock for Org B product with Org A credentials (should FAIL)
SELECT public.adjust_master_stock(
  '<beta_product_id>',
  10,
  'Cross-org attack attempt',
  'Should fail',
  'org_xxx123'
);
-- Expected: ERROR - "Access denied: Product does not belong to organization"
```

---

### 5. Cross-Organization Attack Scenarios

#### Attack 1: Direct Database Query Bypass Attempt
```sql
-- User A1 attempts to query Org B data directly (should FAIL due to RLS)
-- This simulates a malicious query injection attempt

SELECT * FROM public.customers WHERE organization_id = 'org_yyy456';
-- Expected: Empty result set (RLS blocks access)

SELECT * FROM public.jobs WHERE organization_id = 'org_yyy456';
-- Expected: Empty result set (RLS blocks access)
```

#### Attack 2: organizationId Parameter Manipulation
```typescript
// User A1 modifies React Query cache to inject wrong org_id
// Attempt in browser console:

// Get current org context
const { orgId } = useOrganizationId(); // Returns 'org_xxx123'

// Try to force fetch Beta customers by manipulating the hook
queryClient.fetchQuery({
  queryKey: ['customers', 'org_yyy456'], // Injecting wrong org_id
  queryFn: async () => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('organization_id', 'org_yyy456'); // Malicious org_id
    return data;
  }
});

// Expected: Empty array (RLS blocks at database level)
```

#### Attack 3: JWT Token Replay Attack
```bash
# User A1 obtains User B1's JWT token (hypothetically)
TOKEN_B1="<stolen_jwt_from_user_b1>"

# Attempt to access Org A resources with Org B token (should FAIL)
curl -X POST https://kbqxyotasszslacozcey.supabase.co/functions/v1/fleet-writes \
  -H "Authorization: Bearer $TOKEN_B1" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "read",
    "organizationId": "org_xxx123"
  }'

# Expected: 403 Forbidden - Token org doesn't match request org
```

---

### 6. Performance & Scale Testing

#### Test 1: Query Performance with organization_id Filter
```sql
-- Verify queries use indexes efficiently
EXPLAIN ANALYZE
SELECT * FROM public.jobs WHERE organization_id = 'org_xxx123';

-- Expected: Index scan on idx_jobs_organization_id
-- Cost: < 10ms for < 10,000 records
```

#### Test 2: Multi-Org Concurrent Access
```bash
# Simulate 10 concurrent requests from different orgs
# Use Apache Bench or similar tool

ab -n 100 -c 10 \
  -H "Authorization: Bearer $TOKEN_A1" \
  https://kbqxyotasszslacozcey.supabase.co/functions/v1/fleet-writes

# Monitor: No data leakage between requests
# Monitor: No cache poisoning across orgs
```

---

### 7. Data Cleanup & Rollback Testing

#### Test 1: Organization Deletion Cascade
```sql
-- Verify all org data is properly deleted when org is removed
-- (Do this in test environment only!)

DELETE FROM public.profiles WHERE organization_id = 'org_xxx123';
DELETE FROM public.customers WHERE organization_id = 'org_xxx123';
DELETE FROM public.jobs WHERE organization_id = 'org_xxx123';

-- Verify cascade deletes work properly
-- Verify no orphaned records remain
```

---

## 🔒 Critical Security Validations

### Validation 1: No Public Data Leakage
```bash
# Make unauthenticated API call (should FAIL)
curl https://kbqxyotasszslacozcey.supabase.co/rest/v1/customers \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Expected: 403 or empty result (RLS blocks access)
```

### Validation 2: organization_id Cannot Be NULL
```sql
-- Attempt to insert customer without organization_id (should FAIL)
INSERT INTO public.customers (name, email)
VALUES ('Orphan Customer', 'orphan@test.com');

-- Expected: ERROR - "organization_id cannot be NULL"
```

### Validation 3: All Clerk Organizations Have Profiles
```sql
-- Verify every Clerk organization has corresponding user_roles entries
SELECT 
  p.id,
  p.clerk_user_id,
  p.organization_id,
  ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE p.organization_id IS NOT NULL;

-- Expected: Every profile has user_roles entry
```

---

## 📋 Testing Results Template

```markdown
## Test Execution Results

**Test Date:** 2025-01-06
**Tester:** [Name]
**Environment:** Production/Staging

### Client-Side Hook Tests
- [ ] useCustomers isolation: PASS/FAIL
- [ ] useJobs isolation: PASS/FAIL
- [ ] useProducts isolation: PASS/FAIL
- [ ] useJobsWithDateRange isolation: PASS/FAIL

### Edge Function Tests
- [ ] fleet-writes authorization: PASS/FAIL
- [ ] customer-docs authorization: PASS/FAIL
- [ ] send-customer-email authorization: PASS/FAIL

### RPC Function Tests
- [ ] add_job_note validation: PASS/FAIL
- [ ] get_job_notes validation: PASS/FAIL
- [ ] adjust_master_stock validation: PASS/FAIL
- [ ] get_product_availability_enhanced validation: PASS/FAIL

### Attack Scenario Tests
- [ ] Direct DB query bypass: BLOCKED ✓
- [ ] organizationId parameter manipulation: BLOCKED ✓
- [ ] JWT token replay attack: BLOCKED ✓

### Performance Tests
- [ ] Query performance acceptable: PASS/FAIL
- [ ] Concurrent access stable: PASS/FAIL

### Critical Validations
- [ ] No public data leakage: PASS/FAIL
- [ ] organization_id NOT NULL enforced: PASS/FAIL
- [ ] All Clerk orgs have profiles: PASS/FAIL
```

---

## 🚨 Known Issues to Address

1. **Public RLS Policies**: Many tables still have public read access (profiles, customers, company_settings)
2. **Missing RLS Policies**: invoices, payments, quotes tables lack RLS protection
3. **Security Definer Views**: Multiple views use SECURITY DEFINER which bypasses RLS

**Next Steps:** Run Phase 5E (RLS Policy Hardening) to address these critical gaps.

---

## 🎯 Success Criteria

✅ Phase 5D is complete when:
1. All 20+ client hooks properly filter by organization_id
2. All 10+ edge functions validate organizationId parameter
3. All 8 RPC functions require and validate org_id parameter
4. Cross-organization access attempts are blocked 100%
5. No data leakage observed in attack scenario tests
6. Performance remains acceptable (< 100ms query times)
7. All test cases documented above show PASS results
