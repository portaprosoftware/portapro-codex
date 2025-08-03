-- Phase 1 Completion: Remove remaining padlock infrastructure
DROP TABLE IF EXISTS public.padlock_code_access_logs CASCADE;

-- Phase 2 Completion: Add includes_lock field to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS includes_lock boolean DEFAULT false;

-- Update existing products to use new field based on supports_padlock
UPDATE public.products SET includes_lock = supports_padlock WHERE includes_lock IS NULL;