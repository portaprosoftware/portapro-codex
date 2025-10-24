-- Remove all RLS policies from service_report_templates
DROP POLICY IF EXISTS "Users can view their own templates" ON service_report_templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON service_report_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON service_report_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON service_report_templates;
DROP POLICY IF EXISTS "Owners can manage all templates" ON service_report_templates;
DROP POLICY IF EXISTS "Admins can view all templates" ON service_report_templates;

-- Disable RLS entirely on the table
ALTER TABLE service_report_templates DISABLE ROW LEVEL SECURITY;

-- Drop the has_role function since it's not needed
DROP FUNCTION IF EXISTS public.has_role(uuid, text);