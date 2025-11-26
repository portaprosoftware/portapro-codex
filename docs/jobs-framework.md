# Jobs Framework

This framework introduces a tenant-aware background job system that can run from a Supabase-backed table queue or via cron-triggered edge functions.

## Core concepts
- **Tenant-first payloads:** Every job must include `orgId` in its payload. Jobs without an org are rejected.
- **Central registry:** Register handlers once with `registerJob(type, handler)` and the executor will resolve them dynamically.
- **Idempotency:** Each job execution hashes the payload and stores a record in `job_runs` to prevent duplicate processing.
- **Queue backends:** Choose between the Supabase table queue (`JOB_QUEUE_BACKEND=table`) or an Edge Function trigger (`JOB_QUEUE_BACKEND=cron`).

## Creating a new job
1. Add a handler in `src/lib/jobs/handlers/yourJob.ts`:
   ```ts
   import type { JobHandler } from '@/lib/jobs';

   export const yourJob: JobHandler = async ({ orgId, data }) => {
     // Implement your logic here
     return { success: true };
   };
   ```
2. Register the job type in `src/lib/jobs/index.ts`:
   ```ts
   import { registerJob } from '@/lib/jobs';
   import { yourJob } from './handlers/yourJob';

   registerJob('yourJob', yourJob);
   ```
3. Ensure your handler is **idempotent** and safely retryable.

## Tenant requirements
- `orgId` is mandatory for every job payload.
- Executors skip any job without a valid org and mark it as failed to prevent cross-tenant work.

## Retry + idempotency behavior
- Each job run is hashed with SHA-256. If `job_runs` already contains that hash, the executor marks the queue item complete without reprocessing.
- Failed jobs are unlocked unless they exceed `JOB_MAX_ATTEMPTS` (default: 5). After that threshold, the record is removed to avoid retry storms.

## Enqueuing from the app
```ts
import { enqueue } from '@/lib/jobs';

await enqueue({
  orgId,
  type: 'yourJob',
  data: { /* payload */ },
});
```

## Cron-triggered jobs with Supabase Scheduled Functions
- Set `JOB_QUEUE_BACKEND=cron` for environments that rely on Supabase Edge Functions.
- Call `trigger(payload)` from within the scheduled function to dispatch work.
- For table-backed environments, use `jobs:run` to poll the queue instead.

## Running the worker locally
- `npm run jobs:enqueue` – helper entry point for enqueue scripts.
- `npm run jobs:run` – starts the executor poller (table backend only).
- Optionally set `JOB_POLL_INTERVAL_MS` to tune polling cadence.

## Adding new migrations
Database structures live in `supabase/migrations`. The provided migration adds `jobs_queue` and `job_runs` with indexes on `org_id`, `created_at`, `job_id`, and `attempts`.
