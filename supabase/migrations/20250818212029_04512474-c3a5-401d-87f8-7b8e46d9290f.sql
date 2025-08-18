-- Phase 2: Extend consumables schema with enhanced fields
-- Add identification, packaging, compliance, and costing columns
ALTER TABLE public.consumables
ADD COLUMN IF NOT EXISTS mpn text,
ADD COLUMN IF NOT EXISTS model_number text,
ADD COLUMN IF NOT EXISTS gtin_barcode text,
ADD COLUMN IF NOT EXISTS supplier_item_id text,
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS case_quantity integer,
ADD COLUMN IF NOT EXISTS fragrance_color_grade text,
ADD COLUMN IF NOT EXISTS dilution_ratio text,
ADD COLUMN IF NOT EXISTS sds_link text,
ADD COLUMN IF NOT EXISTS ghs_hazard_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS expiration_date date,
ADD COLUMN IF NOT EXISTS lot_batch_number text,
ADD COLUMN IF NOT EXISTS case_cost numeric,
ADD COLUMN IF NOT EXISTS cost_per_use numeric,
ADD COLUMN IF NOT EXISTS billable_rule text;

-- Helpful indexes for lookups and search
CREATE INDEX IF NOT EXISTS idx_consumables_mpn ON public.consumables (mpn);
CREATE INDEX IF NOT EXISTS idx_consumables_gtin_barcode ON public.consumables (gtin_barcode);
CREATE INDEX IF NOT EXISTS idx_consumables_supplier_item_id ON public.consumables (supplier_item_id);
CREATE INDEX IF NOT EXISTS idx_consumables_brand ON public.consumables (brand);
