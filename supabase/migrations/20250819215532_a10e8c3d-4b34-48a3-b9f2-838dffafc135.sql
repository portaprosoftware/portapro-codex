-- Remove RLS from maintenance_sessions to align with project policy (no RLS)

-- Drop any existing policies on maintenance_sessions
DROP POLICY IF EXISTS "Allow read access to maintenance_sessions" ON public.maintenance_sessions;
DROP POLICY IF EXISTS "Allow insert access to maintenance_sessions" ON public.maintenance_sessions;
DROP POLICY IF EXISTS "Allow update access to maintenance_sessions" ON public.maintenance_sessions;
DROP POLICY IF EXISTS "Allow delete access to maintenance_sessions" ON public.maintenance_sessions;

-- Disable RLS on the table
ALTER TABLE public.maintenance_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_sessions NO FORCE ROW LEVEL SECURITY;