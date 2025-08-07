-- Function to sync product stock totals and fix data inconsistencies
CREATE OR REPLACE FUNCTION public.sync_product_stock_totals()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_record RECORD;
  individual_count INTEGER;
  assigned_count INTEGER;
  fixed_count INTEGER := 0;
  result jsonb;
BEGIN
  -- Loop through all products that track inventory
  FOR product_record IN 
    SELECT id, name, stock_total, stock_in_service 
    FROM public.products 
    WHERE track_inventory = true
  LOOP
    -- Get actual individual item counts
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status IN ('assigned', 'reserved')) as assigned
    INTO individual_count, assigned_count
    FROM public.product_items 
    WHERE product_id = product_record.id;
    
    -- Calculate correct stock_in_service (should be assigned individual items + bulk reservations)
    SELECT COALESCE(SUM(quantity), 0) + assigned_count
    INTO assigned_count
    FROM public.equipment_assignments
    WHERE product_id = product_record.id
      AND status IN ('assigned', 'delivered', 'in_service');
    
    -- Update if stock_in_service is incorrect
    IF product_record.stock_in_service != assigned_count THEN
      UPDATE public.products 
      SET 
        stock_in_service = assigned_count,
        updated_at = now()
      WHERE id = product_record.id;
      
      fixed_count := fixed_count + 1;
      
      RAISE LOG 'Fixed product %: stock_in_service % -> %', 
        product_record.name, product_record.stock_in_service, assigned_count;
    END IF;
    
    -- Ensure master stock is not less than individual items
    IF product_record.stock_total < individual_count THEN
      UPDATE public.products 
      SET 
        stock_total = individual_count,
        updated_at = now()
      WHERE id = product_record.id;
      
      RAISE LOG 'Adjusted master stock for %: % -> %', 
        product_record.name, product_record.stock_total, individual_count;
    END IF;
  END LOOP;
  
  result := jsonb_build_object(
    'success', true,
    'products_fixed', fixed_count,
    'message', 'Stock synchronization completed',
    'synced_at', now()
  );
  
  RETURN result;
END;
$$;