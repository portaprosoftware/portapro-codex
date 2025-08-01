-- Add padlock support to products table
ALTER TABLE public.products 
ADD COLUMN supports_padlock boolean DEFAULT false;

-- Add padlock tracking columns to product_items table
ALTER TABLE public.product_items 
ADD COLUMN currently_padlocked boolean DEFAULT false,
ADD COLUMN padlock_type text CHECK (padlock_type IN ('standard', 'combination', 'keyed')),
ADD COLUMN padlock_code_reference text,
ADD COLUMN last_padlock_timestamp timestamp with time zone,
ADD COLUMN last_unlock_timestamp timestamp with time zone,
ADD COLUMN padlocked_by uuid,
ADD COLUMN unlocked_by uuid;

-- Create padlock activity log table
CREATE TABLE public.padlock_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_item_id uuid NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('padlock', 'unlock')),
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  performed_by uuid,
  location_coordinates point,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.padlock_activity_log 
ADD CONSTRAINT fk_padlock_activity_product_item 
FOREIGN KEY (product_item_id) REFERENCES public.product_items(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_padlock_activity_product_item ON public.padlock_activity_log(product_item_id);
CREATE INDEX idx_padlock_activity_timestamp ON public.padlock_activity_log(timestamp);

-- Create function to log padlock activities
CREATE OR REPLACE FUNCTION public.log_padlock_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log padlock state changes
  IF (OLD.currently_padlocked IS DISTINCT FROM NEW.currently_padlocked) THEN
    INSERT INTO public.padlock_activity_log (
      product_item_id,
      action_type,
      timestamp,
      performed_by
    ) VALUES (
      NEW.id,
      CASE WHEN NEW.currently_padlocked THEN 'padlock' ELSE 'unlock' END,
      CASE WHEN NEW.currently_padlocked THEN NEW.last_padlock_timestamp ELSE NEW.last_unlock_timestamp END,
      CASE WHEN NEW.currently_padlocked THEN NEW.padlocked_by ELSE NEW.unlocked_by END
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically log padlock activities
CREATE TRIGGER trigger_log_padlock_activity
  AFTER UPDATE ON public.product_items
  FOR EACH ROW
  EXECUTE FUNCTION public.log_padlock_activity();

-- Create function to get overdue padlocked units
CREATE OR REPLACE FUNCTION public.get_overdue_padlocked_units()
RETURNS TABLE(
  item_id uuid,
  item_code text,
  product_name text,
  padlock_type text,
  last_padlock_timestamp timestamp with time zone,
  days_overdue integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pi.id,
    pi.item_code,
    p.name,
    pi.padlock_type,
    pi.last_padlock_timestamp,
    (EXTRACT(EPOCH FROM (NOW() - pi.last_padlock_timestamp)) / 86400)::integer as days_overdue
  FROM public.product_items pi
  JOIN public.products p ON pi.product_id = p.id
  WHERE pi.currently_padlocked = true
    AND pi.last_padlock_timestamp < (NOW() - INTERVAL '24 hours')
    AND pi.status != 'maintenance'
  ORDER BY pi.last_padlock_timestamp ASC;
END;
$$;

-- Create function to handle padlock operations
CREATE OR REPLACE FUNCTION public.handle_padlock_operation(
  item_uuid uuid,
  operation_type text,
  user_uuid uuid,
  padlock_type_param text DEFAULT NULL,
  code_reference text DEFAULT NULL,
  location_coords point DEFAULT NULL,
  notes_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_record RECORD;
  result jsonb;
BEGIN
  -- Get item details
  SELECT * INTO item_record 
  FROM public.product_items pi
  JOIN public.products p ON pi.product_id = p.id
  WHERE pi.id = item_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found');
  END IF;
  
  -- Check if product supports padlocks
  IF NOT item_record.supports_padlock THEN
    RETURN jsonb_build_object('success', false, 'error', 'This product type does not support padlocks');
  END IF;
  
  -- Handle padlock operation
  IF operation_type = 'padlock' THEN
    IF item_record.currently_padlocked THEN
      RETURN jsonb_build_object('success', false, 'error', 'Item is already padlocked');
    END IF;
    
    UPDATE public.product_items 
    SET 
      currently_padlocked = true,
      padlock_type = padlock_type_param,
      padlock_code_reference = code_reference,
      last_padlock_timestamp = NOW(),
      padlocked_by = user_uuid
    WHERE id = item_uuid;
    
  ELSIF operation_type = 'unlock' THEN
    IF NOT item_record.currently_padlocked THEN
      RETURN jsonb_build_object('success', false, 'error', 'Item is not currently padlocked');
    END IF;
    
    UPDATE public.product_items 
    SET 
      currently_padlocked = false,
      last_unlock_timestamp = NOW(),
      unlocked_by = user_uuid
    WHERE id = item_uuid;
    
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid operation type');
  END IF;
  
  -- Log the activity with location and notes
  INSERT INTO public.padlock_activity_log (
    product_item_id,
    action_type,
    performed_by,
    location_coordinates,
    notes
  ) VALUES (
    item_uuid,
    operation_type,
    user_uuid,
    location_coords,
    notes_param
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Padlock operation completed successfully');
END;
$$;