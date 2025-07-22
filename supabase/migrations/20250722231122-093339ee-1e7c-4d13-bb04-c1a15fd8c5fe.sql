
-- Create function to get quote metrics
CREATE OR REPLACE FUNCTION public.get_quote_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_value numeric := 0;
  pending_value numeric := 0;
  accepted_value numeric := 0;
  draft_value numeric := 0;
  sent_value numeric := 0;
  expired_value numeric := 0;
  result jsonb;
BEGIN
  -- Calculate total quote value
  SELECT COALESCE(SUM(total_amount), 0)
  INTO total_value
  FROM public.quotes
  WHERE deleted_at IS NULL;
  
  -- Calculate pending value (draft + sent + pending)
  SELECT COALESCE(SUM(total_amount), 0)
  INTO pending_value
  FROM public.quotes
  WHERE status IN ('draft', 'sent', 'pending')
    AND deleted_at IS NULL;
  
  -- Calculate accepted value
  SELECT COALESCE(SUM(total_amount), 0)
  INTO accepted_value
  FROM public.quotes
  WHERE status = 'accepted'
    AND deleted_at IS NULL;
  
  -- Calculate draft value
  SELECT COALESCE(SUM(total_amount), 0)
  INTO draft_value
  FROM public.quotes
  WHERE status = 'draft'
    AND deleted_at IS NULL;
  
  -- Calculate sent value
  SELECT COALESCE(SUM(total_amount), 0)
  INTO sent_value
  FROM public.quotes
  WHERE status = 'sent'
    AND deleted_at IS NULL;
  
  -- Calculate expired value
  SELECT COALESCE(SUM(total_amount), 0)
  INTO expired_value
  FROM public.quotes
  WHERE status = 'expired'
    AND deleted_at IS NULL;
  
  -- Build result JSON
  result := jsonb_build_object(
    'total_value', total_value,
    'pending_value', pending_value,
    'accepted_value', accepted_value,
    'draft_value', draft_value,
    'sent_value', sent_value,
    'expired_value', expired_value,
    'total_count', (SELECT COUNT(*) FROM public.quotes WHERE deleted_at IS NULL),
    'pending_count', (SELECT COUNT(*) FROM public.quotes WHERE status IN ('draft', 'sent', 'pending') AND deleted_at IS NULL),
    'accepted_count', (SELECT COUNT(*) FROM public.quotes WHERE status = 'accepted' AND deleted_at IS NULL)
  );
  
  RETURN result;
END;
$$;

-- Create function to get invoice metrics
CREATE OR REPLACE FUNCTION public.get_invoice_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_value numeric := 0;
  paid_value numeric := 0;
  unpaid_value numeric := 0;
  overdue_value numeric := 0;
  result jsonb;
BEGIN
  -- Calculate total invoice value
  SELECT COALESCE(SUM(amount), 0)
  INTO total_value
  FROM public.invoices;
  
  -- Calculate paid value
  SELECT COALESCE(SUM(amount), 0)
  INTO paid_value
  FROM public.invoices
  WHERE status = 'paid';
  
  -- Calculate unpaid value
  SELECT COALESCE(SUM(amount), 0)
  INTO unpaid_value
  FROM public.invoices
  WHERE status = 'unpaid';
  
  -- Calculate overdue value
  SELECT COALESCE(SUM(amount), 0)
  INTO overdue_value
  FROM public.invoices
  WHERE status = 'unpaid'
    AND due_date < CURRENT_DATE;
  
  -- Build result JSON
  result := jsonb_build_object(
    'total_value', total_value,
    'paid_value', paid_value,
    'unpaid_value', unpaid_value,
    'overdue_value', overdue_value,
    'total_count', (SELECT COUNT(*) FROM public.invoices),
    'paid_count', (SELECT COUNT(*) FROM public.invoices WHERE status = 'paid'),
    'unpaid_count', (SELECT COUNT(*) FROM public.invoices WHERE status = 'unpaid'),
    'overdue_count', (SELECT COUNT(*) FROM public.invoices WHERE status = 'unpaid' AND due_date < CURRENT_DATE)
  );
  
  RETURN result;
END;
$$;
