-- Update the user_role enum to use 'dispatcher' instead of 'dispatch'
-- First, update any existing 'dispatch' roles to 'dispatcher'
UPDATE public.user_roles 
SET role = 'dispatcher'::text 
WHERE role = 'dispatch'::text;

-- Drop the old enum and create a new one with the correct values
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('admin', 'dispatcher', 'driver');

-- Recreate the user_roles table with the updated enum
ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE public.user_role 
USING role::text::public.user_role;