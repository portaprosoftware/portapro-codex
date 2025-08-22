-- Retry cleanup with explicit casts to avoid type mismatches
-- 1) Delete user_roles that reference temp clerk_user_ids not present in profiles
DELETE FROM public.user_roles 
WHERE user_id LIKE 'temp_%' 
  AND user_id NOT IN (SELECT clerk_user_id FROM public.profiles);

-- 2) Delete duplicate "Driver One" temp profiles only if a real (non-temp) one exists
--    and ensure the temp profile is not referenced by any dependent tables
DELETE FROM public.profiles p
WHERE p.first_name = 'Driver'
  AND p.last_name = 'One'
  AND p.clerk_user_id LIKE 'temp_%'
  AND EXISTS (
    SELECT 1 FROM public.profiles p2 
    WHERE p2.first_name = 'Driver' 
      AND p2.last_name = 'One' 
      AND p2.clerk_user_id NOT LIKE 'temp_%'
  )
  -- No references (compare IDs as text to avoid uuid/text mismatches)
  AND NOT EXISTS (SELECT 1 FROM public.driver_documents d WHERE d.driver_id::text = p.id::text)
  AND NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.driver_id::text = p.id::text)
  AND NOT EXISTS (SELECT 1 FROM public.job_notes jn WHERE jn.driver_id::text = p.id::text)
  AND NOT EXISTS (SELECT 1 FROM public.daily_vehicle_assignments dva WHERE dva.driver_id::text = p.id::text)
  AND NOT EXISTS (SELECT 1 FROM public.disposal_manifests dm WHERE dm.driver_id::text = p.id::text)
  AND NOT EXISTS (SELECT 1 FROM public.driver_devices dd WHERE dd.driver_id::text = p.id::text)
  AND NOT EXISTS (SELECT 1 FROM public.driver_activity_log dal WHERE dal.driver_id::text = p.id::text)
  AND NOT EXISTS (SELECT 1 FROM public.driver_equipment_qualifications deq WHERE deq.driver_id::text = p.id::text)
  AND NOT EXISTS (SELECT 1 FROM public.driver_ppe_info dpi WHERE dpi.driver_id::text = p.id::text);
