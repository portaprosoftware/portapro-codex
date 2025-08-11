-- Fix the get_route_stock_status function to resolve ambiguous column reference
CREATE OR REPLACE FUNCTION public.get_route_stock_status(vehicle_uuid uuid, service_date date)
 RETURNS TABLE(
   consumable_id uuid, 
   consumable_name text, 
   needed_qty integer, 
   vehicle_balance integer, 
   deficit integer, 
   ok boolean
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as consumable_id,
    c.name as consumable_name,
    COALESCE(route_needs.total_needed, 0) as needed_qty,
    COALESCE(vehicle_stock.current_balance, 0) as vehicle_balance,
    GREATEST(0, COALESCE(route_needs.total_needed, 0) - COALESCE(vehicle_stock.current_balance, 0)) as deficit,
    (COALESCE(vehicle_stock.current_balance, 0) >= COALESCE(route_needs.total_needed, 0)) as ok
  FROM public.consumables c
  LEFT JOIN (
    -- Calculate total consumables needed for jobs assigned to this vehicle on this date
    SELECT 
      ji.consumable_id,
      SUM(ji.quantity) as total_needed
    FROM public.job_items ji
    INNER JOIN public.jobs j ON j.id = ji.job_id
    WHERE j.vehicle_id = vehicle_uuid 
      AND j.scheduled_date = service_date
      AND j.status NOT IN ('completed', 'cancelled')
    GROUP BY ji.consumable_id
  ) route_needs ON route_needs.consumable_id = c.id
  LEFT JOIN (
    -- Calculate current vehicle stock balance
    SELECT 
      csl.consumable_id,
      COALESCE(SUM(
        CASE 
          WHEN csl.type IN ('load', 'transfer_in') THEN csl.qty
          WHEN csl.type IN ('unload', 'transfer_out', 'consume') THEN -csl.qty
          ELSE 0
        END
      ), 0) as current_balance
    FROM public.consumable_stock_ledger csl
    WHERE csl.vehicle_id = vehicle_uuid
    GROUP BY csl.consumable_id
  ) vehicle_stock ON vehicle_stock.consumable_id = c.id
  WHERE c.is_active = true
    AND (route_needs.total_needed > 0 OR vehicle_stock.current_balance > 0)
  ORDER BY c.name;
END;
$function$;