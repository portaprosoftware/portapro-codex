# Tenant Smoke Suite

The tenant smoke suite is a focused collection of automated tests that validates cross-tenant isolation across PortaPro's most sensitive data surfaces. It is designed to run on every CI cycle to prevent regressions before Row Level Security (RLS) rolls out in Phase 4.

## Purpose

- Verify that Org A can never view or modify Org B data across tables, RPCs, and public entry points.
- Provide early warning when a new feature, migration, or RPC weakens tenant scoping.
- Establish a repeatable, automated baseline that complements manual checks and tenant audit tooling.

## How the suite is structured

```
src/test/tenant-smoke/
├── fixtures.ts       // Generates realistic tenant data for two orgs
├── helpers.ts        // Assertion helpers for isolation checks
└── tenantSmoke.test.ts // Main suite exercising tables, RPCs, and public surfaces
```

### Fixture generation

`createOrgWithData(supabase, orgId)` inserts a complete, minimal dataset for the supplied organization ID:

- Customer
- Invoice + Payment
- Job + Job Item
- Vehicle + Maintenance Record
- Product + Product Item

All records are injected with `organization_id = orgId` via the `tenantTable` helper to mirror production write paths. The function returns every inserted ID so tests can cross-reference entities between tenants.

### Assertion helpers

- `expectNoCrossTenantLeak(result, orgId)`: Ensures the returned rows (if any) belong to the requesting org. Empty or null responses are treated as a pass.
- `expectForbidden(result)`: Confirms an RPC or query responded with an error or no data, which is the expected outcome for cross-tenant access attempts.

## Adding new coverage

1. Extend the fixtures to create the new entity under both orgs.
2. Add a new table or RPC check in `tenantSmoke.test.ts` using the helpers above.
3. If the surface is public (tokens, portals, share links), add a pre-check that asserts mismatched org/token combinations return no data.
4. Document any new commands or environment variables in this file so the suite remains discoverable.

## How it supports Phase 4 (RLS)

- Establishes pre-RLS parity: the suite should pass today and continue passing after RLS lands, proving the rules match application expectations.
- Guards against regressions: any query that skips org scoping will fail the suite before it reaches production.
- Provides fast feedback in CI: runs alongside the tenant audit to deliver two layers of isolation enforcement.

## Running the suite locally

```
SUPABASE_URL=<project-url> \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
npm run test:tenant
```

Use a fresh database or run `docs/cleanup-testing-data.sql` to keep fixtures isolated between runs.

## Failure expectations

- **Data leak**: The test will fail if any table or RPC returns rows where `organization_id` does not match the requested org.
- **Forbidden responses**: Cross-tenant attempts should return an error or empty payload; a populated response is treated as a failure.
- **Missing configuration**: The suite will exit early if Supabase credentials are not provided, as it relies on live database access.

CI blocks merges when the suite fails, ensuring tenant isolation remains airtight.
