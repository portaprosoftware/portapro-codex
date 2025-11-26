# API routes

This project snapshot does not currently include any Next.js API route handlers under `/app/api`. When API routes are introduced, apply tenant safety helpers from `@/lib/db/tenant` (tenantTable + requireOrgId) to scope reads and writes to `organization_id`.
