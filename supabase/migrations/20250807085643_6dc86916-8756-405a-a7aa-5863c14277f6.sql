-- Reset the 3000s category counter to 0 to reclaim wasted numbers
UPDATE public.company_settings 
SET next_item_numbers = jsonb_set(
  next_item_numbers, 
  '{"3000"}', 
  '0'::jsonb
) 
WHERE id = (SELECT id FROM public.company_settings LIMIT 1);