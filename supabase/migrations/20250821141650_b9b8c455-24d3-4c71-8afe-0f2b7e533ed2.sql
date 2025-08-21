-- Disable RLS on job_drafts per project policy (no RLS)
ALTER TABLE IF EXISTS public.job_drafts DISABLE ROW LEVEL SECURITY;