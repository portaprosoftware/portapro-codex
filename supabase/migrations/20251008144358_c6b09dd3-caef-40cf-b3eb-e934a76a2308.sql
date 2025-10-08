-- Update document category colors to refined, psychologically cohesive palette
-- Maintenance & Operations categories stay #F97316 (Orange 500)
-- No changes needed for maintenance group

-- Update Vehicle Ownership & Compliance categories to #2563EB (Blue 600)
UPDATE public.document_categories
SET color = '#2563EB'
WHERE parent_group = 'compliance' AND is_active = true;

-- Update Driver & Personnel categories to #7C3AED (Violet 600)
UPDATE public.document_categories
SET color = '#7C3AED'
WHERE parent_group = 'personnel' AND is_active = true;

-- Update Equipment & Asset Management categories to #059669 (Emerald 600)
UPDATE public.document_categories
SET color = '#059669'
WHERE parent_group = 'equipment' AND is_active = true;

-- Update Photos & Visual Records categories to #6B7280 (Gray 500)
UPDATE public.document_categories
SET color = '#6B7280'
WHERE parent_group = 'photos' AND is_active = true;

-- Update Financial & Administrative categories to #EAB308 (Amber 500)
UPDATE public.document_categories
SET color = '#EAB308'
WHERE parent_group = 'financial' AND is_active = true;

-- Update Catch-All / Miscellaneous categories to #9CA3AF (Gray 400)
UPDATE public.document_categories
SET color = '#9CA3AF'
WHERE parent_group = 'other' AND is_active = true;