-- Update existing 'dispatch' roles to 'dispatcher' 
UPDATE public.user_roles 
SET role = 'dispatcher'::app_role 
WHERE role::text = 'dispatch';