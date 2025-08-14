-- Drop all padlock-related functions
DROP FUNCTION IF EXISTS public.log_padlock_activity() CASCADE;
DROP FUNCTION IF EXISTS public.get_overdue_padlocked_units(date) CASCADE;
DROP FUNCTION IF EXISTS public.handle_padlock_operation(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.log_padlock_code_access(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.report_padlock_incident(uuid, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_padlock_security_incidents(date, date) CASCADE;
DROP FUNCTION IF EXISTS public.update_padlock_incidents_updated_at() CASCADE;

-- Remove supports_padlock column from products table
ALTER TABLE public.products DROP COLUMN IF EXISTS supports_padlock;