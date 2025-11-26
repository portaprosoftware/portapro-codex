# Release Runbook

This runbook keeps tenant-aware launches repeatable, safe, and quick to validate. Pair it with the tenant smoke test to block regressions before and after deploys.

## Pre-deploy checklist
- **Environment parity**
  - Confirm staging mirrors production feature flags, Clerk configuration, and Supabase extensions.
  - Verify `.env` values for Supabase URL/keys and Stripe keys match the target environment (no cross-env leakage).
- **Domains + routing**
  - Validate primary domains and subdomains are mapped in Vercel (preview + production) and DNS has propagated.
  - Confirm `vercel.json` rewrites/redirects align with expected tenant routing (subdomain → tenant guard).
- **Clerk redirect URLs**
  - Ensure Clerk allows the production domains for OAuth redirect URLs and webhook destinations.
  - Confirm `VITE_ALLOWED_CLERK_ORG_SLUGS` and `VITE_CLERK_PUBLISHABLE_KEY` match the target deploy environment.
- **Data + migrations**
  - Review pending migrations for org_id coverage and backfill steps.
  - Snapshot critical tables or ensure point-in-time recovery is available.

## Deploy steps
1. **Freeze risky changes**: Hold schema edits and payment config changes during the deploy window.
2. **Run migrations (ordered)**:
   - Execute schema migrations first (idempotent where possible).
   - Run data backfills next, verifying they scope by `organization_id`.
3. **Deploy to Vercel**:
   - Deploy **Preview** first if feature-flag validation is needed.
   - Deploy **Production** last using the production environment variables.
4. **Warm critical paths**: Hit the dashboard and driver schedule routes to prime caches and edge paths.

## Post-deploy checks
- **Routing + UX**
  - Validate tenant subdomain → correct Clerk organization and dashboard.
  - Check marketing → app transitions preserve session state.
- **Auth + org switching**
  - Log in as two orgs; ensure `EnsureActiveOrg` activates the matching tenant and cross-tenant nav is blocked.
- **Tenant isolation quick scan**
  - Run `npm run smoke:tenant` with org A/B IDs and route IDs to ensure RPC isolation.
  - Required env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SMOKE_ORG_A_ID`, `SMOKE_ORG_B_ID`, `SMOKE_ROUTE_A_ID`, `SMOKE_ROUTE_B_ID`.
  - Spot check RLS-protected pages (dashboard KPIs, route manifest) for org-specific data.
- **Payments (if enabled)**
  - Create a $0 test invoice and ensure it targets only the active tenant’s Stripe Connect account.
  - Verify webhook processing logs show the correct `organization_id` context.

## Rollback plan
- **Application**: Re-deploy the last known good Vercel production build (from the deployment list) and flip traffic.
- **Database**:
  - If migration caused issues, revert via rollback scripts or restore from the latest snapshot/PITR.
  - Disable offending feature flags tied to new data paths.
- **Access control**: Temporarily lock new sign-ups or org invites in Clerk if tenant isolation is at risk.
- **After rollback**: Re-run `npm run smoke:tenant` and a quick manual org-switch test to confirm isolation is intact.
