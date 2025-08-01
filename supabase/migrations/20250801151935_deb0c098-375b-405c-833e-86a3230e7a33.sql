-- Fix the get_next_job_number function to use proper WHERE clauses
DROP FUNCTION IF EXISTS public.get_next_job_number(text);

CREATE OR REPLACE FUNCTION public.get_next_job_number(job_type_param text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefix TEXT;
  next_num INTEGER;
  result TEXT;
BEGIN
  -- Get prefix from company settings based on job type with proper WHERE clause
  CASE job_type_param
    WHEN 'delivery' THEN 
      SELECT delivery_prefix, next_delivery_number INTO prefix, next_num 
      FROM public.company_settings 
      WHERE id = (SELECT MIN(id) FROM public.company_settings)
      LIMIT 1;
      
      UPDATE public.company_settings 
      SET next_delivery_number = next_delivery_number + 1 
      WHERE id = (SELECT MIN(id) FROM public.company_settings);
      
    WHEN 'pickup' THEN 
      SELECT pickup_prefix, next_pickup_number INTO prefix, next_num 
      FROM public.company_settings 
      WHERE id = (SELECT MIN(id) FROM public.company_settings)
      LIMIT 1;
      
      UPDATE public.company_settings 
      SET next_pickup_number = next_pickup_number + 1 
      WHERE id = (SELECT MIN(id) FROM public.company_settings);
      
    WHEN 'service' THEN 
      SELECT service_prefix, next_service_number INTO prefix, next_num 
      FROM public.company_settings 
      WHERE id = (SELECT MIN(id) FROM public.company_settings)
      LIMIT 1;
      
      UPDATE public.company_settings 
      SET next_service_number = next_service_number + 1 
      WHERE id = (SELECT MIN(id) FROM public.company_settings);
      
    WHEN 'cleaning' THEN 
      SELECT cleaning_prefix, next_cleaning_number INTO prefix, next_num 
      FROM public.company_settings 
      WHERE id = (SELECT MIN(id) FROM public.company_settings)
      LIMIT 1;
      
      UPDATE public.company_settings 
      SET next_cleaning_number = next_cleaning_number + 1 
      WHERE id = (SELECT MIN(id) FROM public.company_settings);
      
    WHEN 'return' THEN 
      SELECT return_prefix, next_return_number INTO prefix, next_num 
      FROM public.company_settings 
      WHERE id = (SELECT MIN(id) FROM public.company_settings)
      LIMIT 1;
      
      UPDATE public.company_settings 
      SET next_return_number = next_return_number + 1 
      WHERE id = (SELECT MIN(id) FROM public.company_settings);
      
    ELSE 
      prefix := 'JOB';
      next_num := 1;
  END CASE;
  
  -- Format: PREFIX-001
  result := prefix || '-' || LPAD(next_num::TEXT, 3, '0');
  
  RETURN result;
END;
$$;