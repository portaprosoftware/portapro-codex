-- Remove RLS policies from template sections and section types tables
ALTER TABLE public.template_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_types DISABLE ROW LEVEL SECURITY;

-- Drop the RLS policies
DROP POLICY IF EXISTS "Public access to template sections" ON public.template_sections;
DROP POLICY IF EXISTS "Public access to section types" ON public.section_types;