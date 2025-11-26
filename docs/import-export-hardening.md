# Import/Export Hardening

This backend-only import/export framework is designed to keep every bulk data operation tenant-safe, atomic, and auditable.

## Adding a New Import Type

1. Create a validator in `src/lib/imports/validators/` that lists **allowed** fields, **required** fields, UUID fields, and numeric fields. Use `createValidator` to reject unknown columns and normalize values.
2. If the entity references other tenant-scoped tables, add `foreignKeys` pointing at those tables so cross-tenant references are rejected before insert.
3. Add the validator to `validators/index.ts` and update `ImportType` so the orchestrator can discover it.
4. Expose an API route under `src/pages/api/import/<entity>.ts` by calling `createImportHandler` with the new import type.
5. Update tests in `src/test/imports/imports.test.ts` to cover success, validation failure, and cross-tenant rejection scenarios.

## Import Flow and Validators

1. The API receives CSV text, parses it via `parseCsv`, and enforces UTF-8, row and column limits, and formula-injection protections.
2. Records are validated with the entity-specific validator, which trims values, rejects unexpected columns, validates UUIDs, and converts numeric fields safely.
3. Foreign key ownership is verified with tenant-scoped lookups before any database writes occur.
4. If **any** validation or ownership check fails, the entire operation is aborted with detailed row-level errors.

## Transaction Safety

`runImport` wraps inserts in a Supabase RPC (`run_atomic_import`) when available, or falls back to tenant-scoped inserts. Validation occurs before inserts, ensuring no partial writes. Any error prevents inserts from being attempted.

## Error Reporting

Failures return a response shaped like:

```json
{
  "ok": false,
  "message": "Import failed",
  "errors": [
    { "row": 2, "field": "email", "error": "Invalid format" },
    { "row": 5, "field": "customer_id", "error": "Belongs to another tenant" }
  ]
}
```

Row numbers match the CSV line to make remediation easy.

## Import Audit Log

Every attempt (success or failure) writes an entry to `import_audit_log` with org, user, type, totals, and error payloads. This guarantees enterprise-grade traceability and helps Customer Success diagnose issues quickly.

## Export Safety

Exports in `src/lib/exports` always filter by `organization_id` via `tenantTable` and only include an allowlist of fields. Cells are escaped to prevent CSV injection and include a UTF-8 BOM for Excel compatibility.
