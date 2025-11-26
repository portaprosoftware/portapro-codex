# Tenant-aware indexing strategy

To keep tenant dashboards responsive without over-indexing, prioritize composite and single-column indexes that match our most common filters:

- **Tenant scoping:** Every high-volume table with `organization_id` should have an index starting with that column. When time-series queries are common, pair `organization_id` with `created_at` for better range scans.
- **Routes and stops:** Pair `organization_id` with routing identifiers (for example, `route_id`) so dispatch and operations views can join quickly.
- **Selective uniqueness:** Use partial unique indexes on routing slugs (e.g., `org_slug` on `organizations`) with `WHERE ... IS NOT NULL` to avoid blocking inserts that intentionally omit slugs.
- **Safety first:** Before adding new NOT NULL constraints, verify the column is fully populated. If there is any doubt, add a diagnostic query and skip the constraint to avoid breaking deployments.

Apply indexes with `CREATE INDEX IF NOT EXISTS` to keep migrations idempotent and deploy-safe.
