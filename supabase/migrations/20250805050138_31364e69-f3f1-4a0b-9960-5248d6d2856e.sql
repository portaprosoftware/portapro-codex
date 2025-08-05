-- Add item code categories configuration to company_settings
ALTER TABLE public.company_settings 
ADD COLUMN item_code_categories JSONB DEFAULT '{"1000": "Standard Units", "2000": "ADA Units", "3000": "Luxury Units", "4000": "Specialty Units"}'::jsonb;

-- Add tracking for next available number in each category
ALTER TABLE public.company_settings 
ADD COLUMN next_item_numbers JSONB DEFAULT '{"1000": 1, "2000": 1, "3000": 1, "4000": 1}'::jsonb;

-- Update the generate_item_code function to work with configurable categories
CREATE OR REPLACE FUNCTION public.generate_item_code_with_category(category_prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  next_num INTEGER;
  category_start INTEGER;
  generated_code text;
  company_settings_record RECORD;
BEGIN
  -- Get company settings
  SELECT * INTO company_settings_record FROM public.company_settings LIMIT 1;
  
  -- Parse the category prefix to get the starting number (e.g., "1000" -> 1000)
  category_start := category_prefix::INTEGER;
  
  -- Get the next number for this category from company settings
  next_num := COALESCE((company_settings_record.next_item_numbers->>category_prefix)::INTEGER, 1);
  
  -- Generate the 4-digit code (category start + sequence number)
  generated_code := (category_start + next_num - 1)::text;
  
  -- Update the next number for this category
  UPDATE public.company_settings 
  SET next_item_numbers = jsonb_set(
    next_item_numbers, 
    ('{"' || category_prefix || '"}')::text[], 
    (next_num + 1)::text::jsonb
  );
  
  RETURN generated_code;
END;
$function$;