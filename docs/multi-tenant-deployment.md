# PortaPro Multi-Tenant Deployment Guide

## Overview

PortaPro is architected as a **reusable SaaS template** supporting multiple deployment strategies:
- **Single Multi-Tenant Deployment**: One Vercel deployment serving multiple organizations
- **Dedicated Customer Deployments**: Separate Vercel deployment per customer (white-label)

All deployments share a **single Supabase project** with organization-based data isolation.

---

## Architecture Principles

### 🔒 Golden Rules
1. **Zero Hard-Coded Values**: No secrets, URLs, tenant IDs, or org-specific values in source code
2. **Runtime Tenant Resolution**: Organization ID comes from Clerk's native `useOrganization()` hook
3. **Single Supabase Project**: All tenants use one Supabase database with `organization_id` filtering
4. **Clerk Organizations**: Primary tenant boundary and source of truth for `organization_id`

### 🗂️ Data Isolation
- **Application Layer**: All hooks filter by `organization_id` from Clerk
- **Database Layer**: Every table has `organization_id` column with indexes
- **Future Enhancement**: RLS policies for defense-in-depth

---

## Prerequisites

### Required Accounts
- [ ] Clerk account with Organizations feature enabled
- [ ] Supabase project (existing project ID: `kbqxyotasszslacozcey`)
- [ ] Vercel account (for deployment)
- [ ] GitHub repository connected to Lovable

### Required Tools
- Node.js 18+ or 20+
- npm or pnpm

---

## Part 1: Setting Up a New Customer

### Step 1: Create Clerk Organization

1. **Log into Clerk Dashboard**: https://dashboard.clerk.com
2. **Navigate to Organizations** (in your app's settings)
3. **Create New Organization**:
   - **Name**: Customer's company name (e.g., "Acme Portable Restrooms")
   - **Slug**: URL-friendly identifier (e.g., `acme-corp`)
   - **Copy the Organization ID**: This is your `organization_id` for Supabase

### Step 2: Invite Customer Users to Clerk Organization

1. In Clerk Dashboard → Organizations → [Customer's Org]
2. **Invite Members** via email
3. **Assign Roles**:
   - `org:owner` - Full access, billing, user management
   - `org:admin` - Most features, cannot manage users
   - `org:dispatcher` - Scheduling and job management
   - `org:driver` - Mobile app, job completion
   - `org:viewer` - Read-only access

### Step 3: Sync User to Supabase (Automatic)

When users log in, `useClerkProfileSync` automatically:
- Creates/updates their profile in `profiles` table
- Stores the Clerk `organization_id` in `profiles.organization_id`
- Creates role in `user_roles` table

**No manual database setup required!**

---

## Part 2: Deployment Strategies

### Option A: Multi-Tenant Single Deployment

**Use Case**: Serve multiple customers from one deployment (e.g., app.portaprosoftware.com)

#### Environment Variables

```bash
# Public Variables (VITE_ prefix)
VITE_APP_URL=https://app.portaprosoftware.com
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_SUPABASE_URL=https://kbqxyotasszslacozcey.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=kbqxyotasszslacozcey
VITE_MAPBOX_TOKEN=pk.xxx
VITE_ALLOWED_CLERK_ORG_SLUGS=acme-corp,smith-rentals,demo-tenant

# Server-Only Secrets (NO VITE_ prefix)
CLERK_SECRET_KEY=sk_live_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

#### Vercel Deployment Steps

1. **In Vercel Project Settings → Environment Variables**:
   - Add all variables above
   - Set for: Production, Preview, Development
2. **Deploy**: `git push` or click Deploy in Vercel Dashboard
3. **Verify**: Check `TenantGuard` allows only listed orgs in `VITE_ALLOWED_CLERK_ORG_SLUGS`

---

### Option B: Dedicated Customer Deployment (White-Label)

**Use Case**: Give customer their own subdomain/domain (e.g., acme.portapro.app or porta.acme.com)

#### Environment Variables

```bash
# Public Variables
VITE_APP_URL=https://acme.portapro.app
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_SUPABASE_URL=https://kbqxyotasszslacozcey.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=kbqxyotasszslacozcey
VITE_MAPBOX_TOKEN=pk.xxx
VITE_ALLOWED_CLERK_ORG_SLUGS=acme-corp  # Only this customer

# Server-Only Secrets (same as above)
CLERK_SECRET_KEY=sk_live_...
# ... rest of server secrets
```

#### Vercel Deployment Steps

1. **Create New Vercel Project** (or branch deployment)
2. **Link to GitHub Repository** (same repo, different deployment)
3. **Configure Environment Variables** with customer-specific values
4. **Set Custom Domain** in Vercel → Domains
5. **Deploy**

---

## Part 3: Data Migration for Existing Tenants

If you have existing data with placeholder `organization_id` values:

```sql
-- Example: Update all records for a specific customer
UPDATE jobs 
SET organization_id = 'org_2abc123xyz' 
WHERE organization_id = 'portapro-demo';

UPDATE customers 
SET organization_id = 'org_2abc123xyz' 
WHERE organization_id = 'portapro-demo';

-- Repeat for all tables with organization_id
```

**Tables to Update** (35+ tables):
- jobs, customers, invoices, quotes
- products, product_items, equipment_assignments
- vehicles, driver_shifts, shift_templates
- certification_types, employee_certifications
- maintenance_reports, work_orders
- And more... (see migration file for full list)

---

## Part 4: Testing Multi-Tenant Isolation

### Test Checklist

- [ ] **User Login**: User sees only their organization's data
- [ ] **Job Creation**: New job has correct `organization_id`
- [ ] **Cross-Org Isolation**: User from Org A cannot see Org B's data
- [ ] **Profile Sync**: `profiles.organization_id` matches Clerk org
- [ ] **Role Permissions**: Roles work correctly per organization

### Testing Commands

```bash
# Check organization_id in database
SELECT DISTINCT organization_id FROM jobs LIMIT 10;

# Verify profile sync
SELECT clerk_user_id, organization_id, email FROM profiles;

# Check for orphaned data (should be empty after migration)
SELECT COUNT(*) FROM jobs WHERE organization_id IS NULL;
```

---

## Part 5: Troubleshooting

### Issue: User sees "Access Denied" from TenantGuard

**Cause**: User's Clerk organization slug not in `VITE_ALLOWED_CLERK_ORG_SLUGS`

**Solution**: 
1. Add org slug to environment variable
2. Redeploy frontend in Vercel

### Issue: Data not filtering by organization

**Cause**: Hook not using `useOrganizationId()` or missing `.eq('organization_id', orgId)`

**Solution**: Check hook implementation follows pattern:
```typescript
const { orgId } = useOrganizationId();
// ...
.eq('organization_id', orgId)
```

### Issue: Organization ID is null

**Cause**: User not in any Clerk organization

**Solution**: 
1. Invite user to organization in Clerk Dashboard
2. User must accept invitation and re-login

---

## Part 6: Scaling Considerations

### Adding New Customers

**Multi-Tenant Deployment**:
1. Create Clerk organization
2. Add org slug to `VITE_ALLOWED_CLERK_ORG_SLUGS`
3. Redeploy frontend

**Dedicated Deployment**:
1. Create Clerk organization
2. Create new Vercel project
3. Deploy with customer-specific env vars

### Database Performance

- All queries filtered by `organization_id` (indexed)
- Consider partitioning if single org exceeds 1M+ records
- Monitor query performance in Supabase Dashboard

### Cost Management

- **Supabase**: Usage-based (database size, API calls)
- **Vercel**: Per deployment (consider consolidating to multi-tenant)
- **Clerk**: Per active user

---

## Security Best Practices

✅ **DO**:
- Use `useOrganizationId()` in all data hooks
- Filter all Supabase queries by `organization_id`
- Store secrets in Vercel environment variables
- Validate org membership in `TenantGuard`

❌ **DON'T**:
- Hard-code organization IDs in source code
- Use `publicMetadata.organizationId` (legacy pattern)
- Expose server secrets to client (never use `VITE_` prefix)
- Skip `organization_id` filtering in any query

---

## Quick Reference

### Key Files
- `src/hooks/useOrganizationId.ts` - Org ID resolution
- `src/hooks/useClerkProfileSync.ts` - Profile sync with org ID
- `src/components/auth/TenantGuard.tsx` - Access control
- `supabase/functions/profile_sync/index.ts` - Server-side sync
- `supabase/migrations/20251106012155_*.sql` - Org ID schema

### Key Concepts
- **Clerk Organization ID**: Primary tenant identifier (e.g., `org_2abc123xyz`)
- **Organization Slug**: URL-friendly name (e.g., `acme-corp`)
- **TenantGuard**: Component enforcing org access control
- **Profile Sync**: Automatic user → Supabase sync on login

---

## Support & Resources

- **Clerk Docs**: https://clerk.dev/docs/organizations/overview
- **Supabase Docs**: https://supabase.com/docs
- **PortaPro Repo**: Connected via Lovable GitHub integration
- **Deployment Issues**: Check Vercel build logs and Supabase edge function logs

---

**Last Updated**: November 2025  
**Maintained By**: PortaPro Development Team
