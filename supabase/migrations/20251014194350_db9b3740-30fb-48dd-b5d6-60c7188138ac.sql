-- Create function to automatically create maintenance session from completed work order
CREATE OR REPLACE FUNCTION public.auto_create_maintenance_session_from_work_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  target_item_id uuid;
  session_num integer;
BEGIN
  -- Only proceed if status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Only process work orders for product items (individual units)
    IF NEW.asset_type = 'vehicle' THEN
      -- Get the product_item_id from asset_id (it's directly the item)
      target_item_id := NEW.asset_id;
      
      -- Get next session number for this item
      SELECT COALESCE(MAX(session_number), 0) + 1
      INTO session_num
      FROM public.maintenance_sessions
      WHERE item_id = target_item_id;
      
      -- Create maintenance session record
      INSERT INTO public.maintenance_sessions (
        item_id,
        session_number,
        started_at,
        completed_at,
        total_cost,
        total_labor_hours,
        primary_technician,
        session_summary,
        status,
        work_order_id,
        outcome
      ) VALUES (
        target_item_id,
        session_num,
        COALESCE(NEW.opened_at, NEW.created_at),
        NEW.closed_at,
        COALESCE(NEW.total_cost, 0),
        COALESCE(NEW.total_labor_hours, 0),
        NEW.assigned_to,
        COALESCE(
          CONCAT(
            'Work Order #', NEW.work_order_number, E'\n\n',
            COALESCE(NEW.description, ''), E'\n\n',
            COALESCE(NEW.resolution_notes, '')
          ),
          NEW.description
        ),
        'completed',
        NEW.id,
        'returned_to_service'
      )
      ON CONFLICT (work_order_id) 
      DO UPDATE SET
        completed_at = EXCLUDED.completed_at,
        total_cost = EXCLUDED.total_cost,
        total_labor_hours = EXCLUDED.total_labor_hours,
        primary_technician = EXCLUDED.primary_technician,
        session_summary = EXCLUDED.session_summary,
        status = EXCLUDED.status,
        updated_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on work_orders table
DROP TRIGGER IF EXISTS trigger_create_maintenance_session_from_work_order ON public.work_orders;
CREATE TRIGGER trigger_create_maintenance_session_from_work_order
  AFTER INSERT OR UPDATE ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_maintenance_session_from_work_order();

-- Add work_order_id column to maintenance_sessions if it doesn't exist
ALTER TABLE public.maintenance_sessions 
ADD COLUMN IF NOT EXISTS work_order_id uuid REFERENCES public.work_orders(id);

-- Add unique constraint to prevent duplicate sessions from same work order
ALTER TABLE public.maintenance_sessions 
DROP CONSTRAINT IF EXISTS maintenance_sessions_work_order_id_key;

ALTER TABLE public.maintenance_sessions 
ADD CONSTRAINT maintenance_sessions_work_order_id_key UNIQUE (work_order_id);