-- Drop existing functions
DROP FUNCTION IF EXISTS public.can_delete_user(uuid);
DROP FUNCTION IF EXISTS public.force_delete_user(uuid);
DROP FUNCTION IF EXISTS public.purge_users_except(text);

-- Update can_delete_user to accept text identifier (UUID or Clerk ID)
CREATE OR REPLACE FUNCTION public.can_delete_user(profile_identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  resolved_profile_id uuid;
  upcoming_jobs_count integer;
  active_assignments_count integer;
  result jsonb;
BEGIN
  -- Resolve profile ID from either UUID or clerk_user_id
  SELECT id INTO resolved_profile_id
  FROM public.profiles
  WHERE id::text = profile_identifier 
     OR clerk_user_id = profile_identifier
  LIMIT 1;
  
  IF resolved_profile_id IS NULL THEN
    RETURN jsonb_build_object(
      'can_delete', false,
      'reason', 'Profile not found'
    );
  END IF;
  
  -- Check for upcoming jobs
  SELECT COUNT(*)
  INTO upcoming_jobs_count
  FROM public.jobs
  WHERE driver_id::text = resolved_profile_id::text
    AND scheduled_date >= CURRENT_DATE
    AND status NOT IN ('completed', 'cancelled');
  
  -- Check for active vehicle assignments
  SELECT COUNT(*)
  INTO active_assignments_count
  FROM public.daily_vehicle_assignments
  WHERE driver_id = profile_identifier
    AND assignment_date >= CURRENT_DATE;
  
  IF upcoming_jobs_count > 0 OR active_assignments_count > 0 THEN
    result := jsonb_build_object(
      'can_delete', false,
      'reason', CASE 
        WHEN upcoming_jobs_count > 0 AND active_assignments_count > 0 
          THEN upcoming_jobs_count || ' upcoming jobs and ' || active_assignments_count || ' active vehicle assignments'
        WHEN upcoming_jobs_count > 0 
          THEN upcoming_jobs_count || ' upcoming jobs scheduled'
        WHEN active_assignments_count > 0 
          THEN active_assignments_count || ' active vehicle assignments'
      END,
      'upcoming_jobs', upcoming_jobs_count,
      'active_assignments', active_assignments_count
    );
  ELSE
    result := jsonb_build_object(
      'can_delete', true,
      'reason', null,
      'upcoming_jobs', 0,
      'active_assignments', 0
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Update force_delete_user to accept text identifier
CREATE OR REPLACE FUNCTION public.force_delete_user(profile_identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  resolved_profile_id uuid;
  clerk_id text;
  summary jsonb := '{}'::jsonb;
  cnt int;
BEGIN
  -- Resolve profile
  SELECT id, clerk_user_id INTO resolved_profile_id, clerk_id
  FROM public.profiles
  WHERE id::text = profile_identifier 
     OR clerk_user_id = profile_identifier
  LIMIT 1;
  
  IF resolved_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- Unassign jobs
  UPDATE public.jobs SET driver_id = NULL 
  WHERE driver_id::text = resolved_profile_id::text;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  summary := summary || jsonb_build_object('jobs_unassigned', cnt);

  -- Clear vehicle assignments (uses clerk_user_id)
  UPDATE public.daily_vehicle_assignments SET driver_id = NULL 
  WHERE driver_id = clerk_id;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  summary := summary || jsonb_build_object('vehicle_assignments_cleared', cnt);

  -- Delete driver-specific records
  DELETE FROM public.driver_working_hours WHERE driver_id = resolved_profile_id;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  summary := summary || jsonb_build_object('working_hours_deleted', cnt);

  DELETE FROM public.driver_credentials WHERE driver_id = resolved_profile_id;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  summary := summary || jsonb_build_object('credentials_deleted', cnt);

  DELETE FROM public.driver_shifts WHERE driver_clerk_id = clerk_id;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  summary := summary || jsonb_build_object('shifts_deleted', cnt);

  -- Update disposal manifests
  UPDATE public.disposal_manifests SET driver_id = NULL WHERE driver_id = clerk_id;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  summary := summary || jsonb_build_object('disposal_manifests_updated', cnt);

  -- Update activity logs
  UPDATE public.driver_activity_log SET driver_id = NULL WHERE driver_id = clerk_id;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  summary := summary || jsonb_build_object('activity_log_updated', cnt);

  -- Update decon logs
  UPDATE public.decon_logs SET inspector_clerk_id = NULL WHERE inspector_clerk_id = clerk_id;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  summary := summary || jsonb_build_object('decon_inspector_cleared', cnt);

  UPDATE public.decon_logs SET performed_by_clerk = NULL WHERE performed_by_clerk = clerk_id;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  summary := summary || jsonb_build_object('decon_performer_cleared', cnt);

  -- Delete roles
  DELETE FROM public.user_roles WHERE user_id = resolved_profile_id;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  summary := summary || jsonb_build_object('roles_deleted', cnt);

  -- Delete profile
  DELETE FROM public.profiles WHERE id = resolved_profile_id;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  summary := summary || jsonb_build_object('profiles_deleted', cnt);

  RETURN jsonb_build_object('success', true) || summary;
END;
$$;

-- Update purge function to use new force_delete_user
CREATE OR REPLACE FUNCTION public.purge_users_except(p_owner_clerk_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec record;
  processed int := 0;
  failures int := 0;
  result jsonb;
BEGIN
  FOR rec IN
    SELECT id, clerk_user_id
    FROM public.profiles
    WHERE clerk_user_id IS DISTINCT FROM p_owner_clerk_id
  LOOP
    BEGIN
      result := public.force_delete_user(rec.id::text);
      IF (result->>'success')::boolean THEN
        processed := processed + 1;
      ELSE
        failures := failures + 1;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        failures := failures + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', failures = 0,
    'processed', processed,
    'failures', failures
  );
END;
$$;