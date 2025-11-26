-- Phase 2 RPCs for tenant-safe aggregations
set check_function_bodies = off;

-- Inventory availability with tenant isolation
create or replace function public.pp_get_inventory_availability(
  p_organization_id uuid,
  p_date date,
  p_location_id uuid default null
)
returns table (
  product_id uuid,
  product_name text,
  available_count integer,
  assigned_count integer,
  maintenance_count integer,
  total_count integer,
  as_of_date date,
  location_id uuid
) security invoker language plpgsql as $$
begin
  return query
  with filtered_items as (
    select
      pi.id,
      pi.product_id,
      pi.status,
      coalesce(pi.current_storage_location_id, pi.location::uuid) as resolved_location
    from public.product_items pi
    where pi.organization_id = p_organization_id
      and (p_location_id is null or coalesce(pi.current_storage_location_id, pi.location::uuid) = p_location_id)
  )
  select
    p.id as product_id,
    p.name as product_name,
    count(fi.id) filter (where fi.status = 'available') as available_count,
    count(fi.id) filter (where fi.status in ('assigned', 'in_use')) as assigned_count,
    count(fi.id) filter (where fi.status = 'maintenance') as maintenance_count,
    count(fi.id) as total_count,
    p_date as as_of_date,
    p_location_id as location_id
  from public.products p
  left join filtered_items fi on fi.product_id = p.id
  where p.organization_id = p_organization_id
  group by p.id, p.name, p_date, p_location_id
  order by p.name;
end;
$$;

comment on function public.pp_get_inventory_availability is 'Tenant-safe inventory availability snapshot with optional location filter';

-- Route manifest encapsulation for driver/vehicle routes
create or replace function public.pp_get_route_manifest(
  p_organization_id uuid,
  p_route_id uuid
)
returns table (
  route_id uuid,
  job_id uuid,
  job_number text,
  job_type text,
  scheduled_date date,
  scheduled_time text,
  customer_name text,
  service_address text,
  stop_order integer,
  unit_codes jsonb
) security invoker language plpgsql as $$
begin
  return query
  with route_jobs as (
    select
      j.id,
      j.job_number,
      j.job_type,
      j.scheduled_date,
      j.scheduled_time,
      j.customer_id,
      j.vehicle_id,
      row_number() over (order by j.scheduled_date, j.scheduled_time, j.created_at) as stop_order
    from public.jobs j
    where j.organization_id = p_organization_id
      and j.vehicle_id = p_route_id
  )
  select
    p_route_id as route_id,
    rj.id as job_id,
    rj.job_number,
    rj.job_type,
    rj.scheduled_date,
    rj.scheduled_time,
    c.name as customer_name,
    concat_ws(', ', c.service_street, c.service_city, c.service_state) as service_address,
    rj.stop_order,
    coalesce(jsonb_agg(distinct pi.item_code) filter (where pi.item_code is not null), '[]'::jsonb) as unit_codes
  from route_jobs rj
  left join public.customers c on c.id = rj.customer_id and c.organization_id = p_organization_id
  left join public.job_items ji on ji.job_id = rj.id and ji.organization_id = p_organization_id
  left join public.product_items pi on pi.id = ji.item_id and pi.organization_id = p_organization_id
  group by rj.id, rj.job_number, rj.scheduled_date, rj.scheduled_time, c.name, c.service_street, c.service_city, c.service_state, rj.stop_order
  order by rj.stop_order;
end;
$$;

comment on function public.pp_get_route_manifest is 'Tenant-safe route manifest including customer info and assigned unit codes';

-- Dashboard KPI rollup
create or replace function public.pp_get_dashboard_kpis(
  p_organization_id uuid,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  inventory jsonb,
  jobs jsonb,
  customers jsonb,
  revenue jsonb,
  fuel jsonb,
  vehicles jsonb,
  maintenance jsonb
) security invoker language plpgsql as $$
begin
  return query
  with inventory_metrics as (
    select
      count(distinct p.id) as total_products,
      coalesce(sum(p.stock_total), 0) as total_units,
      coalesce(sum(case when pi.status = 'maintenance' then 1 else 0 end), 0) as maintenance_items
    from public.products p
    left join public.product_items pi on pi.product_id = p.id and pi.organization_id = p_organization_id
    where p.organization_id = p_organization_id
  ),
  job_metrics as (
    select
      count(*) as total_jobs,
      count(*) filter (where job_type = 'delivery') as deliveries,
      count(*) filter (where job_type in ('pickup', 'partial_pickup')) as pickups,
      count(*) filter (where job_type = 'service') as services,
      count(*) filter (where job_type = 'on_site_survey') as surveys
    from public.jobs j
    where j.organization_id = p_organization_id
      and j.scheduled_date >= p_start::date
      and j.scheduled_date <= p_end::date
  ),
  customer_metrics as (
    select
      count(*) as total_customers,
      coalesce((
        select count(distinct j.customer_id)
        from public.jobs j
        where j.organization_id = p_organization_id
          and j.created_at >= (p_end - interval '60 days')
      ), 0) as active_customers
    from public.customers c
    where c.organization_id = p_organization_id
  ),
  revenue_metrics as (
    select coalesce(sum(inv.amount), 0) as total_revenue
    from public.invoices inv
    where inv.organization_id = p_organization_id
      and inv.status = 'paid'
      and inv.created_at >= p_start
      and inv.created_at <= p_end
  ),
  vehicle_metrics as (
    select
      count(*) as total_vehicles,
      count(*) filter (where v.status = 'active') as active,
      count(*) filter (where v.status = 'maintenance') as maintenance
    from public.vehicles v
    where v.organization_id = p_organization_id
  ),
  maintenance_metrics as (
    select
      count(*) as due_soon
    from public.maintenance_records mr
    where mr.organization_id = p_organization_id
      and mr.status = 'scheduled'
      and mr.scheduled_date <= (p_end + interval '7 days')::date
  ),
  fuel_metrics as (
    select coalesce(sum(fl.total_cost), 0) as total_fuel_cost
    from public.fuel_logs fl
    where fl.organization_id = p_organization_id
      and fl.log_date >= p_start::date
      and fl.log_date <= p_end::date
  )
  select
    jsonb_build_object(
      'totalProducts', im.total_products,
      'totalUnits', im.total_units,
      'maintenanceItems', im.maintenance_items
    ) as inventory,
    jsonb_build_object(
      'total', jm.total_jobs,
      'deliveries', jm.deliveries,
      'pickups', jm.pickups,
      'services', jm.services,
      'surveys', jm.surveys
    ) as jobs,
    jsonb_build_object(
      'total', cm.total_customers,
      'active', cm.active_customers
    ) as customers,
    jsonb_build_object('total', rm.total_revenue) as revenue,
    jsonb_build_object('total', fm.total_fuel_cost) as fuel,
    jsonb_build_object(
      'total', vm.total_vehicles,
      'active', vm.active,
      'maintenance', vm.maintenance
    ) as vehicles,
    jsonb_build_object('count', mm.due_soon) as maintenance
  from inventory_metrics im, job_metrics jm, customer_metrics cm, revenue_metrics rm, fuel_metrics fm, vehicle_metrics vm, maintenance_metrics mm;
end;
$$;

comment on function public.pp_get_dashboard_kpis is 'Tenant-safe dashboard KPIs aggregated in the database';
