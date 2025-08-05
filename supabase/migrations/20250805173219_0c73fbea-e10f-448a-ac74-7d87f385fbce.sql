-- Function to calculate actual segment size based on rules
CREATE OR REPLACE FUNCTION public.calculate_smart_segment_size(rules_json jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result_count INTEGER := 0;
  rule_item jsonb;
  where_clauses text[] := '{}';
  where_clause text;
  final_query text;
  current_date_val date := CURRENT_DATE;
BEGIN
  -- Loop through each rule in the rules array
  FOR rule_item IN SELECT jsonb_array_elements(rules_json->'rules')
  LOOP
    -- Skip if rule doesn't have required fields
    CONTINUE WHEN rule_item->>'field' IS NULL OR rule_item->>'operator' IS NULL;
    
    -- Build WHERE clause based on field and operator
    CASE rule_item->>'field'
      WHEN 'type' THEN
        CASE rule_item->>'operator'
          WHEN 'equals' THEN
            where_clauses := array_append(where_clauses, 'c.customer_type = ' || quote_literal(rule_item->>'value'));
          WHEN 'not_equals' THEN
            where_clauses := array_append(where_clauses, 'c.customer_type != ' || quote_literal(rule_item->>'value'));
        END CASE;
      
      WHEN 'email' THEN
        CASE rule_item->>'operator'
          WHEN 'is_not_null' THEN
            where_clauses := array_append(where_clauses, 'c.email IS NOT NULL AND c.email != ''''');
          WHEN 'is_null' THEN
            where_clauses := array_append(where_clauses, '(c.email IS NULL OR c.email = '''')');
        END CASE;
      
      WHEN 'phone' THEN
        CASE rule_item->>'operator'
          WHEN 'is_not_null' THEN
            where_clauses := array_append(where_clauses, 'c.phone IS NOT NULL AND c.phone != ''''');
          WHEN 'is_null' THEN
            where_clauses := array_append(where_clauses, '(c.phone IS NULL OR c.phone = '''')');
        END CASE;
      
      WHEN 'created_at' THEN
        CASE rule_item->>'operator'
          WHEN 'after' THEN
            where_clauses := array_append(where_clauses, 'c.created_at::date > ' || quote_literal(rule_item->>'value'));
          WHEN 'before' THEN
            where_clauses := array_append(where_clauses, 'c.created_at::date < ' || quote_literal(rule_item->>'value'));
          WHEN 'within_last_days' THEN
            where_clauses := array_append(where_clauses, 'c.created_at::date >= ' || quote_literal(current_date_val - (rule_item->>'value')::integer));
          WHEN 'more_than_days_ago' THEN
            where_clauses := array_append(where_clauses, 'c.created_at::date < ' || quote_literal(current_date_val - (rule_item->>'value')::integer));
        END CASE;
      
      WHEN 'last_job_date' THEN
        CASE rule_item->>'operator'
          WHEN 'after' THEN
            where_clauses := array_append(where_clauses, 'last_job.max_date > ' || quote_literal(rule_item->>'value'));
          WHEN 'before' THEN
            where_clauses := array_append(where_clauses, 'last_job.max_date < ' || quote_literal(rule_item->>'value'));
          WHEN 'within_last_days' THEN
            where_clauses := array_append(where_clauses, 'last_job.max_date >= ' || quote_literal(current_date_val - (rule_item->>'value')::integer));
          WHEN 'more_than_days_ago' THEN
            where_clauses := array_append(where_clauses, 'last_job.max_date < ' || quote_literal(current_date_val - (rule_item->>'value')::integer));
        END CASE;
      
      WHEN 'total_delivery_jobs' THEN
        CASE rule_item->>'operator'
          WHEN 'greater_than' THEN
            where_clauses := array_append(where_clauses, 'COALESCE(job_stats.delivery_count, 0) > ' || (rule_item->>'value')::integer);
          WHEN 'less_than' THEN
            where_clauses := array_append(where_clauses, 'COALESCE(job_stats.delivery_count, 0) < ' || (rule_item->>'value')::integer);
          WHEN 'equals' THEN
            where_clauses := array_append(where_clauses, 'COALESCE(job_stats.delivery_count, 0) = ' || (rule_item->>'value')::integer);
        END CASE;
      
      WHEN 'total_spent' THEN
        CASE rule_item->>'operator'
          WHEN 'greater_than' THEN
            where_clauses := array_append(where_clauses, 'COALESCE(invoice_stats.total_paid, 0) > ' || (rule_item->>'value')::numeric);
          WHEN 'less_than' THEN
            where_clauses := array_append(where_clauses, 'COALESCE(invoice_stats.total_paid, 0) < ' || (rule_item->>'value')::numeric);
          WHEN 'between' THEN
            -- For between, value should be formatted as "min,max"
            where_clauses := array_append(where_clauses, 'COALESCE(invoice_stats.total_paid, 0) BETWEEN ' || 
              split_part(rule_item->>'value', ',', 1)::numeric || ' AND ' || 
              split_part(rule_item->>'value', ',', 2)::numeric);
        END CASE;
    END CASE;
  END LOOP;
  
  -- If no valid where clauses, return 0
  IF array_length(where_clauses, 1) IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Build the final query
  where_clause := array_to_string(where_clauses, ' AND ');
  
  final_query := 'SELECT COUNT(DISTINCT c.id) 
    FROM public.customers c
    LEFT JOIN (
      SELECT customer_id, MAX(scheduled_date) as max_date
      FROM public.jobs 
      GROUP BY customer_id
    ) last_job ON c.id = last_job.customer_id
    LEFT JOIN (
      SELECT customer_id, 
             COUNT(*) FILTER (WHERE job_type = ''delivery'') as delivery_count
      FROM public.jobs 
      GROUP BY customer_id
    ) job_stats ON c.id = job_stats.customer_id
    LEFT JOIN (
      SELECT customer_id, 
             SUM(amount) FILTER (WHERE status = ''paid'') as total_paid
      FROM public.invoices 
      GROUP BY customer_id
    ) invoice_stats ON c.id = invoice_stats.customer_id
    WHERE ' || where_clause;
  
  -- Execute the query
  EXECUTE final_query INTO result_count;
  
  RETURN COALESCE(result_count, 0);
END;
$function$;