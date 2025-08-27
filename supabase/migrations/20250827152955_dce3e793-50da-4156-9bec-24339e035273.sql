-- Update unified stock function to handle date-based reservations correctly
CREATE OR REPLACE FUNCTION public.get_unified_product_stock(product_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_record RECORD;
  tracked_total INTEGER := 0;
  individual_available INTEGER := 0;
  individual_maintenance INTEGER := 0;
  individual_on_job INTEGER := 0;
  individual_reserved INTEGER := 0;
  bulk_pool INTEGER := 0;
  bulk_on_job INTEGER := 0;
  bulk_reserved INTEGER := 0;
  bulk_available INTEGER := 0;
  location_breakdown jsonb := '[]'::jsonb;
  total_on_job INTEGER := 0;
  total_reserved INTEGER := 0;
  physically_available INTEGER := 0;
  result jsonb;
BEGIN
  -- Get product information (authoritative master total)
  SELECT id, name, stock_total, track_inventory
  INTO product_record
  FROM public.products
  WHERE id = product_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Product not found');
  END IF;

  -- Tracked item totals
  SELECT COUNT(*)
  INTO tracked_total
  FROM public.product_items
  WHERE product_id = product_uuid;

  SELECT COUNT(*)
  INTO individual_available
  FROM public.product_items
  WHERE product_id = product_uuid AND status = 'available';

  SELECT COUNT(*)
  INTO individual_maintenance
  FROM public.product_items
  WHERE product_id = product_uuid AND status = 'maintenance';

  -- Individual items currently on job (delivered but not picked up yet)
  SELECT COUNT(DISTINCT ea.product_item_id)
  INTO individual_on_job
  FROM public.equipment_assignments ea
  JOIN public.jobs j ON j.id = ea.job_id
  WHERE ea.product_item_id IN (
      SELECT id FROM public.product_items WHERE product_id = product_uuid
  )
    AND ea.status IN ('delivered', 'in_service')
    AND j.status = 'completed'
    AND j.job_type = 'delivery'
    -- Check if there's no completed pickup job yet
    AND NOT EXISTS (
      SELECT 1 FROM public.jobs pickup_job
      WHERE pickup_job.customer_id = j.customer_id
        AND pickup_job.job_type = 'pickup'
        AND pickup_job.status = 'completed'
        AND pickup_job.scheduled_date > j.scheduled_date
    );

  -- Individual items reserved for future jobs
  SELECT COUNT(DISTINCT ea.product_item_id)
  INTO individual_reserved
  FROM public.equipment_assignments ea
  WHERE ea.product_item_id IN (
      SELECT id FROM public.product_items WHERE product_id = product_uuid
  )
    AND ea.assigned_date > CURRENT_DATE
    AND ea.status IN ('assigned');

  -- Bulk pool is the remainder after tracked items
  bulk_pool := GREATEST(COALESCE(product_record.stock_total, 0) - tracked_total, 0);

  -- Bulk currently on job (delivered but not picked up)
  SELECT COALESCE(SUM(ea.quantity), 0)
  INTO bulk_on_job
  FROM public.equipment_assignments ea
  JOIN public.jobs j ON j.id = ea.job_id
  WHERE ea.product_id = product_uuid
    AND ea.product_item_id IS NULL
    AND ea.status IN ('delivered', 'in_service')
    AND j.status = 'completed'
    AND j.job_type = 'delivery'
    -- Check if there's no completed pickup job yet
    AND NOT EXISTS (
      SELECT 1 FROM public.jobs pickup_job
      WHERE pickup_job.customer_id = j.customer_id
        AND pickup_job.job_type = 'pickup'
        AND pickup_job.status = 'completed'
        AND pickup_job.scheduled_date > j.scheduled_date
    );

  -- Bulk reserved for future jobs
  SELECT COALESCE(SUM(ea.quantity), 0)
  INTO bulk_reserved
  FROM public.equipment_assignments ea
  WHERE ea.product_id = product_uuid
    AND ea.product_item_id IS NULL
    AND ea.assigned_date > CURRENT_DATE
    AND ea.status IN ('assigned');

  bulk_available := GREATEST(bulk_pool - bulk_on_job - bulk_reserved, 0);
  total_on_job := individual_on_job + bulk_on_job;
  total_reserved := individual_reserved + bulk_reserved;
  physically_available := individual_available + bulk_available;

  -- Location breakdown is informative only
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'location_id', pls.storage_location_id,
      'location_name', sl.name,
      'bulk_quantity', pls.quantity
    )
  ), '[]'::jsonb)
  INTO location_breakdown
  FROM public.product_location_stock pls
  JOIN public.storage_locations sl ON sl.id = pls.storage_location_id
  WHERE pls.product_id = product_uuid AND pls.quantity > 0;

  -- Build normalized result
  result := jsonb_build_object(
    'product_id', product_uuid,
    'master_stock', product_record.stock_total,
    'individual_items', jsonb_build_object(
      'total_tracked', tracked_total,
      'available', individual_available,
      'maintenance', individual_maintenance,
      'on_job', individual_on_job,
      'reserved', individual_reserved,
      'assigned', GREATEST(tracked_total - individual_available - individual_maintenance - individual_on_job - individual_reserved, 0)
    ),
    'bulk_stock', jsonb_build_object(
      'pool_available', bulk_available,
      'on_job', bulk_on_job,
      'reserved', bulk_reserved,
      'location_breakdown', location_breakdown
    ),
    'totals', jsonb_build_object(
      'physically_available', physically_available,
      'on_job_today', total_on_job,
      'reserved_future', total_reserved,
      'in_maintenance', individual_maintenance,
      'tracked_individual', tracked_total,
      'bulk_pool', bulk_pool
    ),
    'tracking_method', CASE 
      WHEN tracked_total > 0 AND bulk_pool > 0 THEN 'hybrid'
      WHEN tracked_total > 0 THEN 'individual'
      WHEN bulk_pool > 0 THEN 'bulk'
      ELSE 'none'
    END,
    'generated_at', now()
  );

  RETURN result;
END;
$$;

-- Create enhanced availability function for date-range checking
CREATE OR REPLACE FUNCTION public.get_product_availability_enhanced(
  product_type_id uuid,
  start_date date,
  end_date date,
  filter_attributes jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_record RECORD;
  total_stock INTEGER := 0;
  tracked_total INTEGER := 0;
  bulk_pool INTEGER := 0;
  conflicting_bulk INTEGER := 0;
  conflicting_individual INTEGER := 0;
  available_individual INTEGER := 0;
  available_bulk INTEGER := 0;
  individual_items jsonb := '[]'::jsonb;
  result jsonb;
BEGIN
  -- Get product information
  SELECT id, name, stock_total, track_inventory
  INTO product_record
  FROM public.products
  WHERE id = product_type_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('available', 0, 'total', 0, 'method', 'none');
  END IF;

  total_stock := COALESCE(product_record.stock_total, 0);

  -- Get tracked items count
  SELECT COUNT(*) INTO tracked_total
  FROM public.product_items
  WHERE product_id = product_type_id;

  bulk_pool := GREATEST(total_stock - tracked_total, 0);

  -- Find conflicting bulk reservations (assignments that overlap with requested period)
  SELECT COALESCE(SUM(ea.quantity), 0)
  INTO conflicting_bulk
  FROM public.equipment_assignments ea
  WHERE ea.product_id = product_type_id
    AND ea.product_item_id IS NULL
    AND ea.status IN ('assigned', 'delivered', 'in_service')
    AND ea.assigned_date <= end_date
    AND COALESCE(ea.return_date, ea.assigned_date + INTERVAL '30 days') >= start_date;

  -- Find conflicting individual items (assignments that overlap with requested period)
  SELECT COUNT(DISTINCT ea.product_item_id)
  INTO conflicting_individual
  FROM public.equipment_assignments ea
  WHERE ea.product_item_id IN (
      SELECT id FROM public.product_items WHERE product_id = product_type_id
  )
    AND ea.status IN ('assigned', 'delivered', 'in_service')
    AND ea.assigned_date <= end_date
    AND COALESCE(ea.return_date, ea.assigned_date + INTERVAL '30 days') >= start_date;

  -- Calculate available quantities
  available_bulk := GREATEST(bulk_pool - conflicting_bulk, 0);
  available_individual := GREATEST(
    (SELECT COUNT(*) FROM public.product_items 
     WHERE product_id = product_type_id AND status = 'available') - conflicting_individual, 
    0
  );

  -- Get individual items with availability status
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'item_id', pi.id,
      'item_code', pi.item_code,
      'status', pi.status,
      'is_available', (
        pi.status = 'available' AND
        NOT EXISTS (
          SELECT 1 FROM public.equipment_assignments ea2
          WHERE ea2.product_item_id = pi.id
            AND ea2.status IN ('assigned', 'delivered', 'in_service')
            AND ea2.assigned_date <= end_date
            AND COALESCE(ea2.return_date, ea2.assigned_date + INTERVAL '30 days') >= start_date
        )
      ),
      'attributes', pi.attributes
    )
  ), '[]'::jsonb)
  INTO individual_items
  FROM public.product_items pi
  WHERE pi.product_id = product_type_id;

  -- Apply attribute filters if provided
  IF filter_attributes IS NOT NULL THEN
    -- Filter logic would go here - for now return basic availability
  END IF;

  result := jsonb_build_object(
    'available', available_individual + available_bulk,
    'total', total_stock,
    'method', CASE 
      WHEN tracked_total > 0 AND bulk_pool > 0 THEN 'hybrid'
      WHEN tracked_total > 0 THEN 'individual'
      WHEN bulk_pool > 0 THEN 'bulk'
      ELSE 'stock_total'
    END,
    'individual_items', individual_items,
    'breakdown', jsonb_build_object(
      'bulk_pool', available_bulk,
      'available_tracked', available_individual,
      'assigned_tracked', conflicting_individual,
      'bulk_assigned', conflicting_bulk
    ),
    'bulk_assigned', conflicting_bulk,
    'specific_assigned', conflicting_individual
  );

  RETURN result;
END;
$$;