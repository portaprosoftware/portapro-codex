-- Create private storage bucket for fleet files (idempotent)
insert into storage.buckets (id, name, public)
values ('fleet-files', 'fleet-files', false)
on conflict (id) do nothing;

-- Performance indexes for fuel_logs (idempotent)
create index if not exists idx_fuel_logs_vehicle_date on public.fuel_logs (vehicle_id, log_date);
create index if not exists idx_fuel_logs_driver_date on public.fuel_logs (driver_id, log_date);
create index if not exists idx_fuel_logs_created_at on public.fuel_logs (created_at);

-- Performance indexes for daily_vehicle_assignments (idempotent)
create index if not exists idx_dva_vehicle_date on public.daily_vehicle_assignments (vehicle_id, assignment_date);
create index if not exists idx_dva_driver_date on public.daily_vehicle_assignments (driver_id, assignment_date);