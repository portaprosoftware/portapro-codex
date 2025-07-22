
-- Disable RLS on all tables to prevent auth conflicts
ALTER TABLE public.customer_communications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_workflow_transitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_buttons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_maintenance_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_compliance_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_location_coordinates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_time_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_report_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_notification_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_item_attributes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_field_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_equipment_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_vehicle_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_portal_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_document_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_interaction_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies to clean up
DROP POLICY IF EXISTS "Public access" ON public.customer_communications;
DROP POLICY IF EXISTS "Public access" ON public.notification_templates;
DROP POLICY IF EXISTS "Public access" ON public.fuel_logs;
DROP POLICY IF EXISTS "Public access to report workflow transitions" ON public.report_workflow_transitions;
DROP POLICY IF EXISTS "Public access" ON public.saved_buttons;
DROP POLICY IF EXISTS "Public access" ON public.quotes;
DROP POLICY IF EXISTS "Public access" ON public.invoices;
DROP POLICY IF EXISTS "Public access" ON public.customer_contacts;
DROP POLICY IF EXISTS "Allow all operations" ON public.routine_maintenance_services;
DROP POLICY IF EXISTS "Authenticated users can access maintenance services" ON public.routine_maintenance_services;
DROP POLICY IF EXISTS "Public access" ON public.invoice_items;
DROP POLICY IF EXISTS "Public access to vehicle compliance documents" ON public.vehicle_compliance_documents;
DROP POLICY IF EXISTS "Public access to service location coordinates" ON public.service_location_coordinates;
DROP POLICY IF EXISTS "Public access" ON public.location_time_logs;
DROP POLICY IF EXISTS "Public access" ON public.notification_logs;
DROP POLICY IF EXISTS "Public access" ON public.maintenance_report_attachments;
DROP POLICY IF EXISTS "Public access to maintenance notification settings" ON public.maintenance_notification_settings;
DROP POLICY IF EXISTS "Public access" ON public.location_logs;
DROP POLICY IF EXISTS "Public access" ON public.product_item_attributes;
DROP POLICY IF EXISTS "Public access to template categories" ON public.template_categories;
DROP POLICY IF EXISTS "Public access to template field definitions" ON public.template_field_definitions;
DROP POLICY IF EXISTS "Public access" ON public.quote_items;
DROP POLICY IF EXISTS "Public access" ON public.product_items;
DROP POLICY IF EXISTS "Public access" ON public.error_reports;
DROP POLICY IF EXISTS "Public access" ON public.product_properties;
DROP POLICY IF EXISTS "Public access" ON public.job_equipment_assignments;
DROP POLICY IF EXISTS "Public access" ON public.company_settings;
DROP POLICY IF EXISTS "Public access" ON public.maintenance_records;
DROP POLICY IF EXISTS "Public access" ON public.daily_vehicle_assignments;
DROP POLICY IF EXISTS "Public access" ON public.customer_portal_tokens;
DROP POLICY IF EXISTS "Public access to compliance document types" ON public.compliance_document_types;
DROP POLICY IF EXISTS "Public access" ON public.profiles;
DROP POLICY IF EXISTS "Public access" ON public.jobs;
DROP POLICY IF EXISTS "Public access" ON public.customer_interaction_logs;
DROP POLICY IF EXISTS "Public access" ON public.communication_templates;
DROP POLICY IF EXISTS "Customers can create service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Customers can update their own pending requests" ON public.service_requests;
DROP POLICY IF EXISTS "Customers can view their own service requests" ON public.service_requests;

-- Update functions that reference auth.uid() to use Clerk user IDs instead
-- Remove auth-dependent functions that are no longer needed
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.get_user_role_by_clerk_id(text);
DROP FUNCTION IF EXISTS public.clerk_user_has_role(text, text);
DROP FUNCTION IF EXISTS public.clerk_user_is_admin(text);

-- Create a new user_roles table that works with Clerk user IDs
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL, -- This will store Clerk user IDs
  role text NOT NULL CHECK (role IN ('owner', 'dispatch', 'driver', 'customer')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Add trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at 
    BEFORE UPDATE ON public.user_roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update profiles table to use Clerk user IDs as primary key
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS clerk_user_id text UNIQUE;
-- We'll keep the existing id column but make clerk_user_id the main identifier

-- Create helper functions for Clerk-based role checking (without auth dependencies)
CREATE OR REPLACE FUNCTION public.get_user_role(clerk_user_id text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_id = clerk_user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_has_role(clerk_user_id text, required_role text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = clerk_user_id 
    AND role = required_role
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_admin(clerk_user_id text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = clerk_user_id 
    AND role IN ('owner', 'dispatch')
  );
$$;
