DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'get_compliance_notification_counts'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE FUNCTION public.get_compliance_notification_counts() RETURNS TABLE(total integer, overdue integer, critical integer, warning integer) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY SELECT 0,0,0,0; END; $$;';
  END IF;
END$$;