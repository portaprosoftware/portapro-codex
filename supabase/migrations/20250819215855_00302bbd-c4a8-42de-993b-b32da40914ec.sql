-- Cleanup: remove AI-generated legacy maintenance sessions and detach related updates
-- 1) Null out maintenance_session_id on updates referencing legacy sessions
UPDATE public.maintenance_updates mu
SET maintenance_session_id = NULL
WHERE maintenance_session_id IN (
  SELECT id FROM public.maintenance_sessions
  WHERE session_summary = 'Legacy maintenance session created during system upgrade'
    AND primary_technician = 'Historical Data'
    AND initial_condition = 'legacy'
);

-- 2) Delete the legacy maintenance sessions
DELETE FROM public.maintenance_sessions
WHERE session_summary = 'Legacy maintenance session created during system upgrade'
  AND primary_technician = 'Historical Data'
  AND initial_condition = 'legacy';