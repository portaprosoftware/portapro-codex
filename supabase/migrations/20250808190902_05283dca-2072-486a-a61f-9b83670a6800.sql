-- Create private storage bucket for fleet files
insert into storage.buckets (id, name, public)
values ('fleet-files', 'fleet-files', false)
on conflict (id) do nothing;

-- Performance indexes for fuel_logs
create index if not exists idx_fuel_logs_vehicle_date on public.fuel_logs (vehicle_id, log_date);
create index if not exists idx_fuel_logs_driver_date on public.fuel_logs (driver_id, log_date);
create index if not exists idx_fuel_logs_created_at on public.fuel_logs (created_at);

-- Performance indexes for daily_vehicle_assignments
create index if not exists idx_dva_vehicle_date on public.daily_vehicle_assignments (vehicle_id, assignment_date);
create index if not exists idx_dva_driver_date on public.daily_vehicle_assignments (driver_id, assignment_date);

-- Stub RPC to satisfy UI badge counts without relying on RLS
create or replace function public.get_compliance_notification_counts()
returns table(total integer, overdue integer, critical integer, warning integer)
language plpgsql
as $$
begin
  return query select 0 as total, 0 as overdue, 0 as critical, 0 as warning;
end;$$;