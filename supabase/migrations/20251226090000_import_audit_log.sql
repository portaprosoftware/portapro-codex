create table if not exists public.import_audit_log (
  id uuid primary key,
  org_id uuid not null,
  user_id uuid,
  type text not null,
  total_rows int not null,
  success_rows int not null,
  failed_rows int not null,
  errors jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

create index if not exists import_audit_log_org_idx on public.import_audit_log (org_id, created_at desc);
