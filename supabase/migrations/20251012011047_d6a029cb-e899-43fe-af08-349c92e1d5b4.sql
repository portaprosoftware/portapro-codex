-- Create robust, ID-agnostic user deletion RPCs
-- These functions handle all cascading deletions and work with both UUID and Clerk IDs

-- Function to delete a user and all their related records
CREATE OR REPLACE FUNCTION public.delete_user_everywhere(profile_identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_profile_id uuid;
  resolved_clerk_id text;
  jobs_updated integer := 0;
  vehicle_assigns_updated integer := 0;
  working_hours_deleted integer := 0;
  credentials_deleted integer := 0;
  shifts_deleted integer := 0;
  manifests_updated integer := 0;
  activity_logs_updated integer := 0;
  decon_logs_updated integer := 0;
  roles_deleted integer := 0;
  profiles_deleted integer := 0;
BEGIN
  -- Try to resolve the identifier as UUID first
  BEGIN
    resolved_profile_id := profile_identifier::uuid;
    SELECT clerk_user_id INTO resolved_clerk_id 
    FROM public.profiles 
    WHERE id = resolved_profile_id;
  EXCEPTION WHEN invalid_text_representation THEN
    -- Not a UUID, treat as Clerk ID
    SELECT id, clerk_user_id INTO resolved_profile_id, resolved_clerk_id
    FROM public.profiles 
    WHERE clerk_user_id = profile_identifier;
  END;

  -- Check if profile was found
  IF resolved_profile_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Profile not found'
    );
  END IF;

  -- Start cascading deletions/updates
  
  -- 1. Nullify driver references in jobs
  UPDATE public.jobs 
  SET driver_id = NULL 
  WHERE driver_id = resolved_clerk_id;
  GET DIAGNOSTICS jobs_updated = ROW_COUNT;

  -- 2. Nullify driver in daily vehicle assignments
  UPDATE public.daily_vehicle_assignments 
  SET driver_id = NULL 
  WHERE driver_id = resolved_clerk_id;
  GET DIAGNOSTICS vehicle_assigns_updated = ROW_COUNT;

  -- 3. Delete driver working hours
  DELETE FROM public.driver_working_hours 
  WHERE driver_id = resolved_profile_id;
  GET DIAGNOSTICS working_hours_deleted = ROW_COUNT;

  -- 4. Delete driver credentials
  DELETE FROM public.driver_credentials 
  WHERE driver_id = resolved_profile_id;
  GET DIAGNOSTICS credentials_deleted = ROW_COUNT;

  -- 5. Delete driver shifts
  DELETE FROM public.driver_shifts 
  WHERE driver_clerk_id = resolved_clerk_id;
  GET DIAGNOSTICS shifts_deleted = ROW_COUNT;

  -- 6. Nullify driver in disposal manifests
  UPDATE public.disposal_manifests 
  SET driver_id = NULL 
  WHERE driver_id = resolved_clerk_id;
  GET DIAGNOSTICS manifests_updated = ROW_COUNT;

  -- 7. Nullify driver in activity logs
  UPDATE public.driver_activity_log 
  SET driver_id = NULL, performed_by = NULL 
  WHERE driver_id = resolved_clerk_id OR performed_by = resolved_clerk_id;
  GET DIAGNOSTICS activity_logs_updated = ROW_COUNT;

  -- 8. Nullify inspector/performer in decon logs
  UPDATE public.decon_logs 
  SET inspector_clerk_id = NULL, performed_by_clerk = NULL, verification_by_clerk = NULL
  WHERE inspector_clerk_id = resolved_clerk_id 
     OR performed_by_clerk = resolved_clerk_id
     OR verification_by_clerk = resolved_clerk_id;
  GET DIAGNOSTICS decon_logs_updated = ROW_COUNT;

  -- 9. Delete from user_roles
  DELETE FROM public.user_roles 
  WHERE user_id = resolved_profile_id;
  GET DIAGNOSTICS roles_deleted = ROW_COUNT;

  -- 10. Delete from profiles
  DELETE FROM public.profiles 
  WHERE id = resolved_profile_id;
  GET DIAGNOSTICS profiles_deleted = ROW_COUNT;

  -- Return success summary
  RETURN jsonb_build_object(
    'success', true,
    'profile_id', resolved_profile_id,
    'clerk_user_id', resolved_clerk_id,
    'summary', jsonb_build_object(
      'jobs_unassigned', jobs_updated,
      'vehicle_assignments_unassigned', vehicle_assigns_updated,
      'working_hours_deleted', working_hours_deleted,
      'credentials_deleted', credentials_deleted,
      'shifts_deleted', shifts_deleted,
      'manifests_unassigned', manifests_updated,
      'activity_logs_updated', activity_logs_updated,
      'decon_logs_updated', decon_logs_updated,
      'roles_deleted', roles_deleted,
      'profiles_deleted', profiles_deleted
    )
  );
END;
$$;

-- Function to purge all non-owner users
CREATE OR REPLACE FUNCTION public.purge_non_owner_users(owner_clerk_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  delete_result jsonb;
  total_processed integer := 0;
  total_success integer := 0;
  total_failed integer := 0;
  failed_users jsonb := '[]'::jsonb;
BEGIN
  -- Loop through all non-owner profiles
  FOR user_record IN 
    SELECT id, clerk_user_id, first_name, last_name, email
    FROM public.profiles 
    WHERE clerk_user_id != owner_clerk_id
       OR clerk_user_id IS NULL
  LOOP
    total_processed := total_processed + 1;
    
    -- Try to delete this user
    delete_result := public.delete_user_everywhere(user_record.id::text);
    
    IF (delete_result->>'success')::boolean THEN
      total_success := total_success + 1;
    ELSE
      total_failed := total_failed + 1;
      failed_users := failed_users || jsonb_build_object(
        'id', user_record.id,
        'name', COALESCE(user_record.first_name || ' ' || user_record.last_name, user_record.email),
        'error', delete_result->>'error'
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'total_processed', total_processed,
    'total_success', total_success,
    'total_failed', total_failed,
    'failed_users', failed_users
  );
END;
$$;