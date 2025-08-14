-- Create trigger function to auto-set condition for maintenance items
CREATE OR REPLACE FUNCTION public.auto_set_maintenance_condition()
RETURNS TRIGGER AS $$
BEGIN
  -- When item status changes TO 'maintenance', set condition to 'needs_repair'
  IF NEW.status = 'maintenance' AND (OLD.status IS NULL OR OLD.status != 'maintenance') THEN
    NEW.condition = 'needs_repair';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on product_items table
CREATE TRIGGER trigger_auto_set_maintenance_condition
  BEFORE UPDATE ON public.product_items
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_maintenance_condition();