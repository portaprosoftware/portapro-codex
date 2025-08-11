-- First, add the new enum values to the existing enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

-- Update existing data to use new role names, casting properly
UPDATE public.user_roles 
SET role = 'admin'::public.app_role 
WHERE role = 'owner'::public.app_role;

UPDATE public.user_roles 
SET role = 'dispatch'::public.app_role 
WHERE role = 'dispatcher'::public.app_role;

-- Remove any customer roles (delete before dropping enum values)
DELETE FROM public.user_roles 
WHERE role = 'customer'::public.app_role;

-- Now we need to recreate the enum with only the values we want
-- This requires a more complex approach since we can't remove enum values directly

-- Create a new enum with the desired values
CREATE TYPE public.app_role_new AS ENUM ('admin', 'dispatch', 'driver');

-- Update the table to use the new enum
ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE public.app_role_new 
USING (
  CASE 
    WHEN role::text = 'admin' THEN 'admin'::public.app_role_new
    WHEN role::text = 'dispatch' THEN 'dispatch'::public.app_role_new
    WHEN role::text = 'driver' THEN 'driver'::public.app_role_new
    ELSE 'driver'::public.app_role_new -- fallback
  END
);

-- Drop the old enum and rename the new one
DROP TYPE public.app_role CASCADE;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- Recreate the has_role function with the correct enum
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