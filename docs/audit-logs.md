# Audit & Security Logging

PortaPro captures tenant-scoped audit records for every sensitive operation and security boundary check. This layer is designed to stay compatible with future RLS rules and to avoid cross-tenant exposure.

## What gets logged

- CRUD mutations across entities (customers, jobs, invoices, payments, routes, etc.).
- Bulk imports/exports (success and failure counts).
- Background job lifecycle events (start, complete, duplicate, failure, missing handler).
- Payment and invoice-related webhook notifications (Stripe events when organization metadata is present).
- Security violations (missing org IDs, tenant leak attempts, invalid/expired tokens, forbidden RPCs).

## Tables

- `audit_logs`: append-only action history with organization scope, user, entity context, metadata, and request fingerprints (IP and user agent).
- `security_events`: captures violations or blocked access attempts with metadata about the source.

## Querying logs

Use the tenant-aware helper to avoid accidental leakage:

```ts
import { getTenantAuditLogs } from "@/lib/audit";

const { data, error } = await getTenantAuditLogs(orgId, supabase);
```

`getTenantAuditLogs` always filters by `org_id`. Avoid querying `audit_logs` directly without a tenant filter.

## Adding new actions

Call `logAction` from any mutation or handler:

```ts
await logAction({
  orgId,
  userId,
  action: "update_invoice",
  entityType: "invoice",
  entityId: invoiceId,
  metadata: { status: "paid" },
  request,
});
```

For security boundaries or rejected attempts use `logSecurityEvent`:

```ts
await logSecurityEvent({
  orgId,
  type: "forbidden_rpc",
  source: "api",
  metadata: { path: "/rpc/secure-endpoint" },
});
```

## Security insights RPC

The `pp_get_security_insights(p_organization_id uuid)` function aggregates:

- Failed access attempts and forbidden RPC counts
- Invalid/expired tokens
- Cross-tenant leak attempts
- Job failures
- A 30-day daily action timeline

## RLS compatibility

Audit tables are designed to remain append-only and tenant-filtered. When enabling RLS, apply policies that allow insert/query only for the caller’s `org_id`, mirroring the helper behavior. Never include data from another tenant in `metadata`.
