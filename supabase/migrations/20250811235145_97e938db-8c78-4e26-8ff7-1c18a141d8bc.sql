-- Add 'dispatcher' to the existing app_role enum
ALTER TYPE public.app_role ADD VALUE 'dispatcher';

-- Update existing 'dispatch' roles to 'dispatcher' 
UPDATE public.user_roles 
SET role = 'dispatcher'::app_role 
WHERE role::text = 'dispatch';