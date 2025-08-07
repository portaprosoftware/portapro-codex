-- Create a preview function that shows next code without incrementing
CREATE OR REPLACE FUNCTION public.preview_next_item_code(category_prefix text)
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
  
  -- Extract the next number for this category, default to 0 if not found
  next_number := COALESCE((current_settings.next_item_numbers->>category_prefix)::INTEGER, 0);
  
  -- Generate the item code: category_prefix + next_number (e.g., "3000" + 0 = "3000")
  generated_code := (category_prefix::INTEGER + next_number)::TEXT;
  
  -- Check if this code already exists and find next available
  WHILE EXISTS (SELECT 1 FROM public.product_items WHERE item_code = generated_code) LOOP
    next_number := next_number + 1;
    generated_code := (category_prefix::INTEGER + next_number)::TEXT;
  END LOOP;
  
  RETURN generated_code;
END;
$$;

-- Modify the existing function to only increment when actually called for saving
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
  
  -- Extract the next number for this category, default to 0 if not found
  next_number := COALESCE((current_settings.next_item_numbers->>category_prefix)::INTEGER, 0);
  
  -- Generate the item code: category_prefix + next_number (e.g., "3000" + 0 = "3000")
  generated_code := (category_prefix::INTEGER + next_number)::TEXT;
  
  -- Check if this code already exists and find next available
  WHILE EXISTS (SELECT 1 FROM public.product_items WHERE item_code = generated_code) LOOP
    next_number := next_number + 1;
    generated_code := (category_prefix::INTEGER + next_number)::TEXT;
  END LOOP;
  
  -- Update the next number for this category (increment by 1 for next time)
  UPDATE public.company_settings 
  SET next_item_numbers = jsonb_set(
    next_item_numbers, 
    ('{"' || category_prefix || '"}')::text[], 
    to_jsonb(next_number + 1)
  )
  WHERE id = current_settings.id;
  
  RETURN generated_code;
END;
$$;