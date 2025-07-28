-- First, check the current constraint on consumables.category
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conrelid = 'public.consumables'::regclass 
AND contype = 'c';

-- Drop the existing check constraint
ALTER TABLE public.consumables DROP CONSTRAINT IF EXISTS consumables_category_check;

-- Add new check constraint that allows all the new category values
ALTER TABLE public.consumables 
ADD CONSTRAINT consumables_category_check 
CHECK (category IN (
  'guest_essentials',
  'deodorizers_fragrances', 
  'cleaning_sanitization',
  'paper_products',
  'replacement_parts_hardware',
  'ppe_safety_supplies',
  'bulk_stock',
  'maintenance',
  'office_supplies',
  'tools',
  'other',
  -- Legacy categories for backward compatibility
  'deodorizer',
  'cleaning_supplies',
  'sanitizer',
  'chemicals',
  'Parts',
  'Safety Equipment',
  'Cleaning Supplies',
  'Chemicals',
  'Paper Products',
  'Maintenance',
  'Office Supplies',
  'Tools',
  'Other'
));

-- Update existing consumables to use new category values
UPDATE public.consumables 
SET category = CASE 
  WHEN category = 'deodorizer' THEN 'deodorizers_fragrances'
  WHEN category = 'cleaning_supplies' THEN 'cleaning_sanitization'
  WHEN category = 'sanitizer' THEN 'cleaning_sanitization'
  WHEN category = 'chemicals' THEN 'cleaning_sanitization'
  WHEN category = 'Parts' THEN 'replacement_parts_hardware'
  WHEN category = 'Safety Equipment' THEN 'ppe_safety_supplies'
  WHEN category = 'Cleaning Supplies' THEN 'cleaning_sanitization'
  WHEN category = 'Chemicals' THEN 'cleaning_sanitization'
  WHEN category = 'Paper Products' THEN 'paper_products'
  WHEN category = 'Maintenance' THEN 'maintenance'
  WHEN category = 'Office Supplies' THEN 'office_supplies'
  WHEN category = 'Tools' THEN 'tools'
  WHEN category = 'Other' THEN 'other'
  ELSE category
END
WHERE category IN (
  'deodorizer', 'cleaning_supplies', 'sanitizer', 'chemicals',
  'Parts', 'Safety Equipment', 'Cleaning Supplies', 'Chemicals',
  'Paper Products', 'Maintenance', 'Office Supplies', 'Tools', 'Other'
);