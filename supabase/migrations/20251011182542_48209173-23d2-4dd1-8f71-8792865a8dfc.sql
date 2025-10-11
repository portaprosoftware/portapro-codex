-- Create function to force delete a user by clearing all references
create or replace function public.force_delete_user(p_profile_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_clerk_id text;
  summary jsonb := '{}'::jsonb;
  cnt int;
begin
  -- Get clerk_user_id for this profile
  select clerk_user_id into v_clerk_id
  from public.profiles
  where id = p_profile_id;
  
  if v_clerk_id is null then
    return jsonb_build_object('success', false, 'error', 'Profile not found');
  end if;

  -- Unassign from jobs
  update public.jobs set driver_id = null where driver_id = p_profile_id;
  get diagnostics cnt = row_count;
  summary := summary || jsonb_build_object('jobs_unassigned', cnt);

  -- Clear vehicle assignments
  update public.daily_vehicle_assignments set driver_id = null where driver_id = v_clerk_id;
  get diagnostics cnt = row_count;
  summary := summary || jsonb_build_object('vehicle_assignments_cleared', cnt);

  -- Delete working hours
  delete from public.driver_working_hours where driver_id = p_profile_id;
  get diagnostics cnt = row_count;
  summary := summary || jsonb_build_object('working_hours_deleted', cnt);

  -- Delete credentials
  delete from public.driver_credentials where driver_id = p_profile_id;
  get diagnostics cnt = row_count;
  summary := summary || jsonb_build_object('credentials_deleted', cnt);

  -- Delete shifts
  delete from public.driver_shifts where driver_clerk_id = v_clerk_id;
  get diagnostics cnt = row_count;
  summary := summary || jsonb_build_object('shifts_deleted', cnt);

  -- Clear disposal manifests
  update public.disposal_manifests set driver_id = null where driver_id = v_clerk_id;
  get diagnostics cnt = row_count;
  summary := summary || jsonb_build_object('disposal_manifests_updated', cnt);

  -- Clear activity log
  update public.driver_activity_log set driver_id = null where driver_id = v_clerk_id;
  get diagnostics cnt = row_count;
  summary := summary || jsonb_build_object('activity_log_updated', cnt);

  -- Clear decon logs inspector
  update public.decon_logs set inspector_clerk_id = null where inspector_clerk_id = v_clerk_id;
  get diagnostics cnt = row_count;
  summary := summary || jsonb_build_object('decon_inspector_cleared', cnt);

  -- Clear decon logs performer
  update public.decon_logs set performed_by_clerk = null where performed_by_clerk = v_clerk_id;
  get diagnostics cnt = row_count;
  summary := summary || jsonb_build_object('decon_performer_cleared', cnt);

  -- Delete user roles
  delete from public.user_roles where user_id = p_profile_id;
  get diagnostics cnt = row_count;
  summary := summary || jsonb_build_object('roles_deleted', cnt);

  -- Delete profile
  delete from public.profiles where id = p_profile_id;
  get diagnostics cnt = row_count;
  summary := summary || jsonb_build_object('profiles_deleted', cnt);

  return jsonb_build_object('success', true) || summary;
end;
$$;

-- Create function to purge all users except the owner
create or replace function public.purge_users_except(p_owner_clerk_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  rec record;
  processed int := 0;
  failures int := 0;
  result jsonb;
begin
  for rec in
    select id
    from public.profiles
    where clerk_user_id is distinct from p_owner_clerk_id
  loop
    begin
      result := public.force_delete_user(rec.id);
      if (result->>'success')::boolean then
        processed := processed + 1;
      else
        failures := failures + 1;
      end if;
    exception
      when others then
        failures := failures + 1;
    end;
  end loop;

  return jsonb_build_object(
    'success', failures = 0,
    'processed', processed,
    'failures', failures
  );
end;
$$;