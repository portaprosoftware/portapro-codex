-- Drop and recreate functions to avoid conflicts
DROP FUNCTION IF EXISTS public.adjust_master_stock(uuid,integer,text,text);

-- Function to safely adjust master stock with validation
CREATE OR REPLACE FUNCTION public.adjust_master_stock(
  product_uuid uuid,
  quantity_change integer,
  reason_text text,
  notes_text text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_record RECORD;
  individual_count INTEGER := 0;
  new_stock INTEGER;
  old_stock INTEGER;
  result jsonb;
BEGIN
  -- Get current product information
  SELECT * INTO product_record 
  FROM public.products 
  WHERE id = product_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;
  
  old_stock := product_record.stock_total;
  new_stock := old_stock + quantity_change;
  
  -- Get count of individual items
  SELECT COUNT(*) INTO individual_count 
  FROM public.product_items 
  WHERE product_id = product_uuid;
  
  -- Validation: cannot reduce stock below individual items count
  IF new_stock < individual_count THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Cannot reduce master stock below individual items count',
      'current_stock', old_stock,
      'individual_items', individual_count,
      'attempted_new_stock', new_stock
    );
  END IF;
  
  -- Validation: cannot go negative
  IF new_stock < 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Stock cannot be negative',
      'current_stock', old_stock,
      'attempted_change', quantity_change
    );
  END IF;
  
  -- Update the stock
  UPDATE public.products 
  SET stock_total = new_stock, updated_at = now()
  WHERE id = product_uuid;
  
  -- Log the adjustment
  INSERT INTO public.stock_adjustments (
    product_id,
    adjustment_type,
    quantity_change,
    previous_quantity,
    new_quantity,
    reason,
    notes,
    adjusted_by
  ) VALUES (
    product_uuid,
    CASE WHEN quantity_change > 0 THEN 'increase' ELSE 'decrease' END,
    quantity_change,
    old_stock,
    new_stock,
    reason_text,
    notes_text,
    auth.uid()
  );
  
  -- Return success with breakdown
  result := jsonb_build_object(
    'success', true,
    'old_stock', old_stock,
    'new_stock', new_stock,
    'quantity_change', quantity_change,
    'individual_items_count', individual_count,
    'bulk_pool', GREATEST(0, new_stock - individual_count),
    'reason', reason_text
  );
  
  RETURN result;
END;
$$;

-- Trigger to validate master stock
CREATE OR REPLACE FUNCTION public.validate_master_stock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  individual_count INTEGER;
BEGIN
  -- Get count of individual items for this product
  SELECT COUNT(*) INTO individual_count 
  FROM public.product_items 
  WHERE product_id = NEW.id;
  
  -- Ensure master stock is not less than individual items count
  IF NEW.stock_total < individual_count THEN
    NEW.stock_total := individual_count;
    RAISE NOTICE 'Master stock adjusted to % to match % individual items', individual_count, individual_count;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS validate_master_stock_trigger ON public.products;
CREATE TRIGGER validate_master_stock_trigger
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_master_stock();