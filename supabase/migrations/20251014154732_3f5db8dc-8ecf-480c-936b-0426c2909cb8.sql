-- Fix the create_maintenance_session_on_status_change function to remove reference to non-existent photos column
CREATE OR REPLACE FUNCTION public.create_maintenance_session_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  session_id UUID;
BEGIN
  -- When item status changes TO 'maintenance', create a new session
  IF NEW.status = 'maintenance' AND (OLD.status IS NULL OR OLD.status != 'maintenance') THEN
    INSERT INTO public.maintenance_sessions (
      item_id,
      initial_condition,
      primary_technician,
      initial_photos,
      status
    ) VALUES (
      NEW.id,
      NEW.condition,
      'System',
      '[]'::jsonb,  -- Empty photos array instead of referencing NEW.photos
      'active'
    ) RETURNING id INTO session_id;
    
    -- Update any maintenance_updates for this item to use the new session_id
    UPDATE public.maintenance_updates 
    SET maintenance_session_id = session_id
    WHERE item_id = NEW.id AND maintenance_session_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;