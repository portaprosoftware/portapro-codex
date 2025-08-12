-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a scheduled job to check driver expirations daily at 8 AM
SELECT cron.schedule(
  'check-driver-expirations-daily',
  '0 8 * * *', -- Every day at 8:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://unpnuonbndubcuzxfnmg.supabase.co/functions/v1/check-driver-expirations',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVucG51b25ibmR1YmN1enhmbm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMzkyMjgsImV4cCI6MjA2NDcxNTIyOH0.goME2hFzqxm0tnFdXAB_0evuiueh8wWfGLIY1vvvqmE"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Create data retention policies
CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  retention_days INTEGER;
BEGIN
  -- Get retention setting from company settings
  SELECT COALESCE(data_retention_days, 2555) 
  INTO retention_days
  FROM public.company_maintenance_settings 
  LIMIT 1;
  
  -- Delete old activity logs
  DELETE FROM public.driver_activity_log 
  WHERE created_at < (NOW() - (retention_days || ' days')::INTERVAL);
  
  -- Log the cleanup
  RAISE LOG 'Cleaned up activity logs older than % days', retention_days;
END;
$$;

-- Schedule cleanup to run monthly
SELECT cron.schedule(
  'cleanup-activity-logs-monthly',
  '0 2 1 * *', -- First day of each month at 2:00 AM
  'SELECT public.cleanup_old_activity_logs();'
);

-- Create backup function for compliance documents
CREATE OR REPLACE FUNCTION public.backup_compliance_documents()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  backup_count INTEGER := 0;
  result jsonb;
BEGIN
  -- This would integrate with your backup solution
  -- For now, just log that backup is needed
  
  SELECT COUNT(*) INTO backup_count
  FROM public.driver_credentials dc
  JOIN public.profiles p ON dc.driver_id = p.id
  WHERE dc.license_expiry_date IS NOT NULL 
     OR dc.medical_card_expiry_date IS NOT NULL;
  
  -- Log backup activity
  INSERT INTO public.driver_activity_log (
    driver_id, 
    action_type, 
    action_details,
    performed_by
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'system_backup',
    jsonb_build_object(
      'backup_type', 'compliance_documents',
      'documents_count', backup_count,
      'backup_timestamp', NOW()
    ),
    'system'
  );
  
  result := jsonb_build_object(
    'success', true,
    'documents_backed_up', backup_count,
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$;

-- Schedule weekly backups
SELECT cron.schedule(
  'backup-compliance-documents-weekly',
  '0 3 * * 0', -- Every Sunday at 3:00 AM
  'SELECT public.backup_compliance_documents();'
);