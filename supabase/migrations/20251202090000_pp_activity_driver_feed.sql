set check_function_bodies = off;

-- Tenant-safe activity feed combining jobs and invoices without client-side joins
create or replace function public.pp_get_activity_feed(
  p_organization_id uuid
)
returns table (
  entry_type text,
  entity_id uuid,
  job_type text,
  amount numeric,
  status text,
  created_at timestamptz,
  customer_name text
) security invoker language plpgsql as $$
begin
  return query
  select *
  from (
    select
      'job'::text as entry_type,
      j.id as entity_id,
      j.job_type,
      null::numeric as amount,
      j.status,
      j.created_at,
      c.name as customer_name
    from public.jobs j
    left join public.customers c on c.id = j.customer_id and c.organization_id = p_organization_id
    where j.organization_id = p_organization_id

    union all

    select
      'invoice'::text as entry_type,
      inv.id as entity_id,
      null::text as job_type,
      inv.amount,
      inv.status,
      inv.created_at,
      c.name as customer_name
    from public.invoices inv
    left join public.customers c on c.id = inv.customer_id and c.organization_id = p_organization_id
    where inv.organization_id = p_organization_id
  ) as combined
  order by created_at desc
  limit 20;
end;
$$;

comment on function public.pp_get_activity_feed is 'Tenant-safe activity feed combining jobs and invoices without client-side joins';

-- Driver debug helper with customer context
create or replace function public.pp_get_driver_debug_info(
  p_organization_id uuid,
  p_date date default null
)
returns table (
  job_id uuid,
  job_number text,
  driver_id uuid,
  job_type text,
  status text,
  scheduled_date date,
  created_at timestamptz,
  customer_name text
) security invoker language plpgsql as $$
begin
  return query
  select
    j.id as job_id,
    j.job_number,
    j.driver_id,
    j.job_type,
    j.status,
    j.scheduled_date,
    j.created_at,
    c.name as customer_name
  from public.jobs j
  left join public.customers c on c.id = j.customer_id and c.organization_id = p_organization_id
  where j.organization_id = p_organization_id
    and (p_date is null or j.scheduled_date = p_date)
  order by j.created_at desc
  limit 100;
end;
$$;

comment on function public.pp_get_driver_debug_info is 'Tenant-safe driver debug list including customer names without client-side joins';
