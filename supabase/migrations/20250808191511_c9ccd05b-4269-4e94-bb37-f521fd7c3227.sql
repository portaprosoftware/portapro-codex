-- Idempotent creation of stub RPC only if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'get_compliance_notification_counts'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE FUNCTION public.get_compliance_notification_counts()\n      RETURNS TABLE(total integer, overdue integer, critical integer, warning integer)\n      LANGUAGE plpgsql AS $$\n      BEGIN\n        RETURN QUERY SELECT 0,0,0,0;\n      END;\n      $$;';
  END IF;
END$$;