-- Create function to get quote metrics for year-to-date
CREATE OR REPLACE FUNCTION public.get_quote_metrics_ytd()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_value numeric := 0;
  pending_value numeric := 0;
  accepted_value numeric := 0;
  result jsonb;
  current_year_start date;
BEGIN
  -- Calculate start of current year
  current_year_start := date_trunc('year', CURRENT_DATE)::date;
  
  -- Calculate total quote value for current year
  SELECT COALESCE(SUM(total_amount), 0)
  INTO total_value
  FROM public.quotes
  WHERE deleted_at IS NULL
    AND created_at >= current_year_start;
  
  -- Calculate pending value (draft + sent + pending) for current year
  SELECT COALESCE(SUM(total_amount), 0)
  INTO pending_value
  FROM public.quotes
  WHERE status IN ('draft', 'sent', 'pending')
    AND deleted_at IS NULL
    AND created_at >= current_year_start;
  
  -- Calculate accepted value for current year
  SELECT COALESCE(SUM(total_amount), 0)
  INTO accepted_value
  FROM public.quotes
  WHERE status = 'accepted'
    AND deleted_at IS NULL
    AND created_at >= current_year_start;
  
  -- Build result JSON
  result := jsonb_build_object(
    'total_value', total_value,
    'pending_value', pending_value,
    'accepted_value', accepted_value,
    'total_count', (SELECT COUNT(*) FROM public.quotes WHERE deleted_at IS NULL AND created_at >= current_year_start),
    'pending_count', (SELECT COUNT(*) FROM public.quotes WHERE status IN ('draft', 'sent', 'pending') AND deleted_at IS NULL AND created_at >= current_year_start),
    'accepted_count', (SELECT COUNT(*) FROM public.quotes WHERE status = 'accepted' AND deleted_at IS NULL AND created_at >= current_year_start),
    'year', EXTRACT(YEAR FROM CURRENT_DATE)
  );
  
  RETURN result;
END;
$$;

-- Create function to get invoice metrics for year-to-date
CREATE OR REPLACE FUNCTION public.get_invoice_metrics_ytd()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_value numeric := 0;
  paid_value numeric := 0;
  unpaid_value numeric := 0;
  result jsonb;
  current_year_start date;
BEGIN
  -- Calculate start of current year
  current_year_start := date_trunc('year', CURRENT_DATE)::date;
  
  -- Calculate total invoice value for current year
  SELECT COALESCE(SUM(amount), 0)
  INTO total_value
  FROM public.invoices
  WHERE created_at >= current_year_start;
  
  -- Calculate paid value for current year
  SELECT COALESCE(SUM(amount), 0)
  INTO paid_value
  FROM public.invoices
  WHERE status = 'paid'
    AND created_at >= current_year_start;
  
  -- Calculate unpaid value for current year
  SELECT COALESCE(SUM(amount), 0)
  INTO unpaid_value
  FROM public.invoices
  WHERE status = 'unpaid'
    AND created_at >= current_year_start;
  
  -- Build result JSON
  result := jsonb_build_object(
    'total_value', total_value,
    'paid_value', paid_value,
    'unpaid_value', unpaid_value,
    'total_count', (SELECT COUNT(*) FROM public.invoices WHERE created_at >= current_year_start),
    'paid_count', (SELECT COUNT(*) FROM public.invoices WHERE status = 'paid' AND created_at >= current_year_start),
    'unpaid_count', (SELECT COUNT(*) FROM public.invoices WHERE status = 'unpaid' AND created_at >= current_year_start),
    'year', EXTRACT(YEAR FROM CURRENT_DATE)
  );
  
  RETURN result;
END;
$$;