-- Update existing 'dispatch' roles to 'dispatcher' with proper casting
UPDATE public.user_roles 
SET role = 'dispatcher'::app_role 
WHERE role = 'dispatch'::app_role;

-- Add 'dispatcher' to the existing enum
ALTER TYPE public.app_role ADD VALUE 'dispatcher';

-- Update any remaining 'dispatch' values to 'dispatcher'
UPDATE public.user_roles 
SET role = 'dispatcher'::app_role 
WHERE role::text = 'dispatch';