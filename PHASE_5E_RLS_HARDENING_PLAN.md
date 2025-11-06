# Phase 5E: RLS Policy Hardening Plan

## 🚨 Critical Security Issues Identified

Based on security scan and linter results, the following tables require immediate RLS policy updates:

---

## Priority 1: Public PII Exposure (CRITICAL)

### Tables with Public Read Access to PII:

1. **profiles** - Contains employee emails, phone numbers, emergency contacts
2. **customers** - Contains customer names, emails, phones, addresses
3. **customer_contacts** - Contains contact emails, phones, job titles
4. **customer_service_locations** - Contains service addresses, GPS coordinates
5. **company_settings** - Contains company config, tax rates, pricing methods
6. **org_invites** - Contains email addresses of invited users
7. **user_roles** - Exposes role assignments publicly

**Impact:** Anyone on the internet can scrape this data without authentication.

**Fix:** Replace public SELECT policies with organization-scoped policies.

---

## Priority 2: Missing RLS Policies (HIGH)

### Tables with RLS Enabled but No Policies:

1. **invoices** - Financial data with no access controls
2. **payments** - Payment records with Stripe IDs exposed
3. **quotes** - Quote data accessible to wrong orgs
4. **job_items** - Equipment assignments need org filtering
5. **job_consumables** - Consumable usage records need protection

**Impact:** Authenticated users can potentially access data from other organizations.

**Fix:** Create organization-scoped RLS policies for all operations (SELECT, INSERT, UPDATE, DELETE).

---

## Priority 3: Security Definer Views (MEDIUM)

### Views Bypassing RLS:

Multiple views defined with SECURITY DEFINER that bypass RLS checks.

**Impact:** Views may expose data across organization boundaries.

**Fix:** Review and either remove SECURITY DEFINER or add explicit organization filtering in view definitions.

---

## Implementation Plan

### Phase 5E-1: Remove Public Read Access (Day 1)

Update the following tables to require authentication and organization membership:

```sql
-- profiles table
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_org_read" ON public.profiles
  FOR SELECT
  USING (organization_id = current_setting('request.jwt.claims', true)::json->>'organizationId');

-- customers table
DROP POLICY IF EXISTS "customers_public_read" ON public.customers;
CREATE POLICY "customers_org_read" ON public.customers
  FOR SELECT
  USING (organization_id = current_setting('request.jwt.claims', true)::json->>'organizationId');

-- customer_contacts table
DROP POLICY IF EXISTS "customer_contacts_public_read" ON public.customer_contacts;
CREATE POLICY "customer_contacts_org_read" ON public.customer_contacts
  FOR SELECT
  USING (organization_id = current_setting('request.jwt.claims', true)::json->>'organizationId');
```

### Phase 5E-2: Add Missing RLS Policies (Day 2)

Create comprehensive RLS policies for all tables:

```sql
-- invoices
CREATE POLICY "invoices_org_select" ON public.invoices
  FOR SELECT
  USING (organization_id = current_setting('request.jwt.claims', true)::json->>'organizationId');

CREATE POLICY "invoices_org_insert" ON public.invoices
  FOR INSERT
  WITH CHECK (organization_id = current_setting('request.jwt.claims', true)::json->>'organizationId');

-- payments
CREATE POLICY "payments_org_select" ON public.payments
  FOR SELECT
  USING (organization_id = current_setting('request.jwt.claims', true)::json->>'organizationId');
```

### Phase 5E-3: Fix Security Definer Views (Day 3)

Review and update views to include organization filtering or remove SECURITY DEFINER flag.

---

## Testing After Each Phase

1. Run security scan: `supabase--linter`
2. Run security tests: Follow Phase 5D testing framework
3. Verify no regressions: Ensure app still functions correctly
4. Document changes: Update RLS policy documentation

---

## Rollback Plan

If issues occur:
1. Keep migration files to revert changes
2. Have backup of current RLS policies
3. Test in staging first before production
4. Deploy during low-traffic hours

---

## Success Metrics

✅ Phase 5E complete when:
- Zero public read access to PII tables
- All tables have organization-scoped RLS policies
- Security scan shows < 50 issues (down from 472)
- No regressions in app functionality
- All Phase 5D tests still pass
