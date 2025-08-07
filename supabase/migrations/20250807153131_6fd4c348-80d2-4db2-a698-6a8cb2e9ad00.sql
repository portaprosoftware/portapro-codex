-- Auto-generate simple QR codes for new product items
CREATE OR REPLACE FUNCTION auto_generate_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-generate QR code data as the item code (simple approach)
  IF NEW.qr_code_data IS NULL THEN
    NEW.qr_code_data := NEW.item_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto QR generation
DROP TRIGGER IF EXISTS auto_generate_qr_trigger ON public.product_items;
CREATE TRIGGER auto_generate_qr_trigger
  BEFORE INSERT ON public.product_items
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_qr_code();