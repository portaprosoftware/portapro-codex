-- Audit logging tables for tenant-aware security analytics
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default now()
);

create index if not exists audit_logs_org_id_idx on public.audit_logs (org_id);
create index if not exists audit_logs_org_entity_idx on public.audit_logs (org_id, entity_type);
create index if not exists audit_logs_org_created_idx on public.audit_logs (org_id, created_at);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  type text not null,
  source text,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

create index if not exists security_events_org_idx on public.security_events (org_id, type);

create or replace function public.pp_get_security_insights(p_organization_id uuid)
returns table (
  failed_access_attempts bigint,
  forbidden_rpc_calls bigint,
  invalid_tokens bigint,
  cross_tenant_blocks bigint,
  job_failures bigint,
  daily_action_counts jsonb
)
language sql
stable
as $$
  select
    coalesce((select count(*) from public.security_events se where se.org_id = p_organization_id and se.type in ('tenant_leak_attempt', 'forbidden_rpc', 'portal_forbidden', 'unauthorized_access')), 0) as failed_access_attempts,
    coalesce((select count(*) from public.security_events se where se.org_id = p_organization_id and se.type = 'forbidden_rpc'), 0) as forbidden_rpc_calls,
    coalesce((select count(*) from public.security_events se where se.org_id = p_organization_id and se.type in ('invalid_token', 'expired_token')), 0) as invalid_tokens,
    coalesce((select count(*) from public.security_events se where se.org_id = p_organization_id and se.type = 'tenant_leak_attempt'), 0) as cross_tenant_blocks,
    coalesce((select count(*) from public.audit_logs al where al.org_id = p_organization_id and al.entity_type = 'job' and al.action in ('job_failed', 'job_error')), 0) as job_failures,
    (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      from (
        select date_trunc('day', created_at) as day, count(*) as actions
        from public.audit_logs
        where org_id = p_organization_id
        group by 1
        order by 1 desc
        limit 30
      ) t
    ) as daily_action_counts;
$$;
