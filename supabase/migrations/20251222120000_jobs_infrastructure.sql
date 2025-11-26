create extension if not exists "pgcrypto";

create table if not exists public.jobs_queue (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  type text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  locked_at timestamptz,
  attempts integer not null default 0
);

create table if not exists public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job_id text not null,
  org_id uuid not null,
  processed_at timestamptz not null default now(),
  result jsonb
);

create index if not exists idx_jobs_queue_org_created on public.jobs_queue (org_id, created_at);
create index if not exists idx_jobs_queue_locked_attempts on public.jobs_queue (locked_at, attempts);
create index if not exists idx_job_runs_job_id on public.job_runs (job_id);
create index if not exists idx_job_runs_org_id on public.job_runs (org_id);
