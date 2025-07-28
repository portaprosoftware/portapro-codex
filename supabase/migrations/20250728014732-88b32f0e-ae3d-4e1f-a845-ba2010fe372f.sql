-- Fix the get_customer_type_counts function to use the correct column name
CREATE OR REPLACE FUNCTION public.get_customer_type_counts()
 RETURNS TABLE(customer_type text, total_count bigint, email_count bigint, sms_count bigint, both_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.customer_type::text as customer_type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE c.email IS NOT NULL AND c.email != '' AND (c.phone IS NULL OR c.phone = '')) as email_count,
    COUNT(*) FILTER (WHERE c.phone IS NOT NULL AND c.phone != '' AND (c.email IS NULL OR c.email = '')) as sms_count,
    COUNT(*) FILTER (WHERE c.email IS NOT NULL AND c.email != '' AND c.phone IS NOT NULL AND c.phone != '') as both_count
  FROM public.customers c
  WHERE c.customer_type IS NOT NULL
  GROUP BY c.customer_type;
END;
$function$