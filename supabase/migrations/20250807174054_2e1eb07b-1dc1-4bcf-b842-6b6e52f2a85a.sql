-- Phase 1: Core Inventory Management Functions

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

-- Enhanced unified stock function with reservations and comprehensive breakdown
CREATE OR REPLACE FUNCTION public.get_unified_product_stock(product_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_record RECORD;
  individual_count INTEGER := 0;
  individual_available INTEGER := 0;
  individual_assigned INTEGER := 0;
  individual_maintenance INTEGER := 0;
  individual_reserved INTEGER := 0;
  bulk_reserved INTEGER := 0;
  total_reserved INTEGER := 0;
  bulk_pool INTEGER := 0;
  physically_available INTEGER := 0;
  result jsonb;
BEGIN
  -- Get product information
  SELECT * INTO product_record 
  FROM public.products 
  WHERE id = product_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Product not found');
  END IF;

  -- Get individual item counts by status
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'available') as available,
    COUNT(*) FILTER (WHERE status = 'assigned') as assigned,
    COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance,
    COUNT(*) FILTER (WHERE status = 'reserved') as reserved
  INTO individual_count, individual_available, individual_assigned, individual_maintenance, individual_reserved
  FROM public.product_items 
  WHERE product_id = product_uuid;

  -- Calculate bulk reservations (from equipment_assignments)
  SELECT COALESCE(SUM(
    CASE 
      WHEN ea.product_id = product_uuid THEN ea.quantity
      ELSE 0
    END
  ), 0) INTO bulk_reserved
  FROM public.equipment_assignments ea
  WHERE ea.product_id = product_uuid
    AND ea.status IN ('assigned', 'delivered', 'in_service');

  -- Total reserved = bulk reservations + individual assigned/reserved items
  total_reserved := bulk_reserved + individual_assigned + individual_reserved;
  
  -- Calculate bulk pool (available for general assignment)
  bulk_pool := GREATEST(0, product_record.stock_total - individual_count - bulk_reserved);
  
  -- Physically available = individual available + bulk pool
  physically_available := individual_available + bulk_pool;

  -- Build comprehensive result
  result := jsonb_build_object(
    'product_id', product_uuid,
    'master_stock', product_record.stock_total,
    'individual_items', jsonb_build_object(
      'total_tracked', individual_count,
      'available', individual_available,
      'assigned', individual_assigned,
      'maintenance', individual_maintenance,
      'reserved', individual_reserved
    ),
    'bulk_stock', jsonb_build_object(
      'pool_available', bulk_pool,
      'reserved', bulk_reserved
    ),
    'totals', jsonb_build_object(
      'physically_available', physically_available,
      'total_reserved', total_reserved,
      'in_maintenance', individual_maintenance,
      'tracked_individual', individual_count,
      'bulk_pool', bulk_pool
    ),
    'tracking_method', CASE 
      WHEN individual_count > 0 AND bulk_pool > 0 THEN 'hybrid'
      WHEN individual_count > 0 THEN 'individual'
      WHEN bulk_pool > 0 THEN 'bulk'
      ELSE 'none'
    END,
    'last_updated', now()
  );
  
  RETURN result;
END;
$$;

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