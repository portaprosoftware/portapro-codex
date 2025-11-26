# Tenant Data Access Guidelines

To keep tenant isolation airtight across PortaPro, follow these rules whenever you touch Supabase queries:

- All queries against tenant tables must use the `tenantTable()` wrapper (or include an explicit `organization_id` filter when working with legacy code under the baseline).
- Avoid direct `supabase.from('<tenant_table>')` calls that skip the tenant guard.
- For ID lookups, always include `organization_id` in the query chain so records cannot be fetched across tenants.
- Inserts into tenant tables should set `organization_id` in the payload.
- Run `pnpm tenant:audit` before committing. CI runs this automatically and will block merges when new isolation violations are detected.

When an intentional exception is needed, add it to the tenant audit baseline with `WRITE_TENANT_BASELINE=1 node ./scripts/tenant-audit.js` and document the rationale in your PR.
