-- Drop the existing restrictive check constraint
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_category_check;

-- Add a new, more flexible constraint that allows common service categories
ALTER TABLE public.services ADD CONSTRAINT services_category_check 
CHECK (category IN (
  'cleaning',
  'maintenance', 
  'repair',
  'inspection',
  'emergency_response',
  'delivery',
  'pickup',
  'installation',
  'consultation',
  'training',
  'other'
));