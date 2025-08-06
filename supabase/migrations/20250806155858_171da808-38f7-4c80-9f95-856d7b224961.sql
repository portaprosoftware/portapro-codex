-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the process-scheduled-campaigns function to run every minute
SELECT cron.schedule(
  'process-scheduled-campaigns',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://unpnuonbndubcuzxfnmg.supabase.co/functions/v1/process-scheduled-campaigns',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVucG51b25ibmR1YmN1enhmbm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMzkyMjgsImV4cCI6MjA2NDcxNTIyOH0.goME2hFzqxm0tnFdXAB_0evuiueh8wWfGLIY1vvvqmE"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);