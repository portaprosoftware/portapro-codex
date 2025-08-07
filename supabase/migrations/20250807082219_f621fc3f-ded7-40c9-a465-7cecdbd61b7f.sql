-- Fix the generate_item_code_with_category function to properly handle JSONB operations
CREATE OR REPLACE FUNCTION public.generate_item_code_with_category(category_prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_settings RECORD;
  next_number INTEGER;
  generated_code TEXT;
BEGIN
  -- Get current company settings
  SELECT * INTO current_settings 
  FROM public.company_settings 
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No company settings found';
  END IF;
  
  -- Extract the next number for this category, default to 1 if not found
  next_number := COALESCE((current_settings.next_item_numbers->>category_prefix)::INTEGER, 1);
  
  -- Generate the item code: category_prefix + padded number (e.g., "1000001")
  generated_code := category_prefix || LPAD(next_number::TEXT, 3, '0');
  
  -- Check if this code already exists
  WHILE EXISTS (SELECT 1 FROM public.product_items WHERE item_code = generated_code) LOOP
    next_number := next_number + 1;
    generated_code := category_prefix || LPAD(next_number::TEXT, 3, '0');
  END LOOP;
  
  -- Update the next number for this category
  UPDATE public.company_settings 
  SET next_item_numbers = jsonb_set(
    next_item_numbers, 
    ('{"' || category_prefix || '"}')::text[], 
    to_jsonb(next_number + 1)
  );
  
  RETURN generated_code;
END;
$$;