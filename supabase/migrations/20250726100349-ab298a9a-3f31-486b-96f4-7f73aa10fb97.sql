-- Remove problematic auth-based RLS policies and replace with public access for Clerk authentication

-- Drop problematic policies on service_requests
DROP POLICY IF EXISTS "Users can view own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users can create own service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Users can update own service requests" ON public.service_requests;

-- Drop problematic policies on customer_notes
DROP POLICY IF EXISTS "Users can view notes for customers they have access to" ON public.customer_notes;
DROP POLICY IF EXISTS "Users can create notes for customers they have access to" ON public.customer_notes;
DROP POLICY IF EXISTS "Users can update notes for customers they have access to" ON public.customer_notes;

-- Drop problematic policies on user_roles
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

-- Drop problematic policies on template_versions
DROP POLICY IF EXISTS "Users can view template versions" ON public.template_versions;
DROP POLICY IF EXISTS "Users can create template versions" ON public.template_versions;

-- Drop duplicate policies on routine_maintenance_services
DROP POLICY IF EXISTS "Authenticated users can access maintenance services" ON public.routine_maintenance_services;

-- Create simple public access policies for tables that don't already have them
CREATE POLICY "Public access to service requests" ON public.service_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to customer notes" ON public.customer_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to template versions" ON public.template_versions FOR ALL USING (true) WITH CHECK (true);