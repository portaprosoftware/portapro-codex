
-- 1) Add indexes for lookups and enforce uniqueness on zip_code
CREATE INDEX IF NOT EXISTS idx_tax_rates_zip_code ON public.tax_rates(zip_code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tax_rates_zip_code ON public.tax_rates(zip_code);

-- 2) Force zip-based resolution and remove the 0.00 flat fallback
UPDATE public.company_settings
SET
  tax_enabled = true,
  tax_method = 'zip_based',
  flat_tax_rate = NULL
WHERE id = (SELECT id FROM public.company_settings LIMIT 1);
