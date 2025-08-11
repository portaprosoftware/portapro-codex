-- Update the app_role enum to match new role structure
-- First, update existing data to use new role names
UPDATE public.user_roles 
SET role = 'admin'::text 
WHERE role = 'owner'::text;

UPDATE public.user_roles 
SET role = 'dispatch'::text 
WHERE role = 'dispatcher'::text;

-- Remove any customer and old admin roles
DELETE FROM public.user_roles 
WHERE role IN ('customer'::text, 'admin'::text);

-- Drop the old enum and create the new one
DROP TYPE IF EXISTS public.app_role CASCADE;

CREATE TYPE public.app_role AS ENUM ('admin', 'dispatch', 'driver');

-- Recreate the user_roles table with the new enum
ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE public.app_role USING role::text::public.app_role;

-- Update any other references to use the new enum
-- Update function signature if it exists
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT exists (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;