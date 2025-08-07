-- Add dynamic consumable categories to company_settings
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS consumable_categories jsonb;

-- Ensure defaults and non-null safety
ALTER TABLE public.company_settings
  ALTER COLUMN consumable_categories SET DEFAULT '[]'::jsonb;

UPDATE public.company_settings
  SET consumable_categories = COALESCE(consumable_categories, '[]'::jsonb);

ALTER TABLE public.company_settings
  ALTER COLUMN consumable_categories SET NOT NULL;