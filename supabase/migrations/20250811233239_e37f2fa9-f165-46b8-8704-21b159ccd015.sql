-- First, add the updated_at column that the trigger expects
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add the new enum values we need (these must be in separate transactions)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dispatch';