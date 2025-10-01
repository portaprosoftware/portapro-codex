-- Fix the generate_spill_kit_restock_request function to use correct column name
CREATE OR REPLACE FUNCTION public.generate_spill_kit_restock_request(
  p_vehicle_id uuid,
  p_missing_items jsonb,
  p_template_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id uuid;
  total_cost numeric := 0;
  item jsonb;
BEGIN
  -- Calculate estimated cost from spill kit inventory (using correct column: unit_cost)
  FOR item IN SELECT * FROM jsonb_array_elements(p_missing_items)
  LOOP
    SELECT total_cost + COALESCE(ski.unit_cost * (item->>'quantity')::integer, 0)
    INTO total_cost
    FROM public.spill_kit_inventory ski
    WHERE ski.item_name = item->>'name';
  END LOOP;

  -- Create restock request
  INSERT INTO public.spill_kit_restock_requests (
    vehicle_id,
    template_id,
    missing_items,
    estimated_cost,
    notes
  ) VALUES (
    p_vehicle_id,
    p_template_id,
    p_missing_items,
    total_cost,
    'Auto-generated from spill kit inspection'
  ) RETURNING id INTO request_id;

  RETURN request_id;
END;
$$;