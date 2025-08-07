-- Create function to generate item codes with category
CREATE OR REPLACE FUNCTION public.generate_item_code_with_category(category_prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_settings jsonb;
  next_number integer;
  generated_code text;
BEGIN
  -- Get current company settings
  SELECT item_code_categories, next_item_numbers 
  INTO current_settings
  FROM public.company_settings 
  LIMIT 1;
  
  -- Get the next number for this category
  next_number := COALESCE((current_settings->category_prefix)::integer, 1);
  
  -- Generate the item code (e.g., "1001", "2001", etc.)
  generated_code := category_prefix || LPAD(next_number::text, 3, '0');
  
  -- Update the next item number for this category
  UPDATE public.company_settings 
  SET next_item_numbers = jsonb_set(
    COALESCE(next_item_numbers, '{}'::jsonb),
    ARRAY[category_prefix],
    to_jsonb(next_number + 1)
  );
  
  RETURN generated_code;
END;
$$;