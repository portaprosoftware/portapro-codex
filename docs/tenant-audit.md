# Tenant Audit Guardrail

The tenant audit is a safety net to keep Lovable-generated code from bypassing PortaPro's multi-tenant isolation model. It runs in CI and locally to catch unsafe Supabase access patterns before they land in main.

## What the audit enforces
- **Raw table reads**: Blocks `supabase.from('<table>')` calls to tenant-owned tables unless they go through `tenantTable(...)`.
- **Client-side joins**: Flags `.select()` payloads that nest other tenant tables (e.g., `customers(name)`), which would skip org_id scoping.
- **RPC payloads**: Ensures every `supabase.rpc()` call passes `p_organization_id` in the argument object.

## Allowlist for known exceptions
Use `scripts/tenant-audit-allowlist.json` to suppress intentional exceptions. Both the **path** and **pattern** must match for the rule to be skipped.

Example default allowlist:
```json
{
  "paths": [
    "src/pages/PublicPayment.tsx",
    "src/pages/public/*.tsx"
  ],
  "patterns": [
    "supabase.from('invoices')"
  ]
}
```

Guidance:
- Keep allowlist entries narrow (specific file or glob plus the exact pattern).
- Prefer fixing the code instead of broadening the allowlist.

## Fixing common violations
- **Raw `from`**: `supabase.from(tenantTable('jobs')).select('*').eq('organization_id', orgId)`.
- **Client join**: Move the join into a server-side RPC or view that enforces org scoping; have the client select only the RPC output.
- **RPC without org**: `supabase.rpc('pp_get_jobs', { p_organization_id: orgId, ...inputs })`.

## Running the audit
- Local: `npm run tenant:audit`
- CI: runs automatically in the GitHub Actions workflow and fails the build on violations.

## Looking ahead (Phase 4 RLS enablement)
This audit is a pre-RLS tripwire. Once Phase 4 rolls out, RLS will hard-enforce org boundaries at the database layer. Until then, this script is the guardrail that keeps the app RLS-ready and prevents regressions in tenant isolation.
