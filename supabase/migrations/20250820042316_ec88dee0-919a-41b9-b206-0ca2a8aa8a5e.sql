-- Update the get_customer_type_counts function to return all customer types including "other"
CREATE OR REPLACE FUNCTION public.get_customer_type_counts()
RETURNS TABLE(
  customer_type TEXT,
  total_count BIGINT,
  email_count BIGINT,
  sms_count BIGINT,
  both_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH all_types AS (
    SELECT unnest(ARRAY[
      'bars_restaurants',
      'construction', 
      'emergency_disaster_relief',
      'events_festivals',
      'municipal_government',
      'other',
      'private_events_weddings',
      'retail',
      'sports_recreation',
      'commercial'
    ]) as type_name
  ),
  customer_counts AS (
    SELECT 
      c.customer_type::text as customer_type,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE c.email IS NOT NULL AND c.phone IS NULL) as email_count,
      COUNT(*) FILTER (WHERE c.phone IS NOT NULL AND c.email IS NULL) as sms_count,
      COUNT(*) FILTER (WHERE c.email IS NOT NULL AND c.phone IS NOT NULL) as both_count
    FROM public.customers c
    WHERE c.customer_type IS NOT NULL 
    AND c.customer_type != 'not_selected'
    GROUP BY c.customer_type
  )
  SELECT 
    at.type_name as customer_type,
    COALESCE(cc.total_count, 0) as total_count,
    COALESCE(cc.email_count, 0) as email_count,
    COALESCE(cc.sms_count, 0) as sms_count,
    COALESCE(cc.both_count, 0) as both_count
  FROM all_types at
  LEFT JOIN customer_counts cc ON at.type_name = cc.customer_type
  ORDER BY at.type_name;
END;
$function$;