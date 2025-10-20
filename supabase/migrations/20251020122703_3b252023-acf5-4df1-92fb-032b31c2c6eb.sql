-- 4.6: Schedule DVIR Reminders with pg_cron
-- Run DVIR reminders daily at 6:00 AM

SELECT cron.schedule(
  'send-dvir-reminders-daily',
  '0 6 * * *', -- 6:00 AM every day
  $$
  SELECT
    net.http_post(
      url := 'https://unpnuonbndubcuzxfnmg.supabase.co/functions/v1/send-dvir-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVucG51b25ibmR1YmN1enhmbm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMzkyMjgsImV4cCI6MjA2NDcxNTIyOH0.goME2hFzqxm0tnFdXAB_0evuiueh8wWfGLIY1vvvqmE'
      ),
      body := jsonb_build_object('source', 'cron', 'timestamp', now())
    ) as request_id;
  $$
);