-- Enhanced Maintenance History System Implementation

-- Add session tracking fields to maintenance_updates table
ALTER TABLE public.maintenance_updates 
ADD COLUMN maintenance_session_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN completion_photos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN completion_notes TEXT,
ADD COLUMN session_status TEXT DEFAULT 'active';

-- Create maintenance_sessions table for comprehensive session tracking
CREATE TABLE public.maintenance_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.product_items(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  initial_condition TEXT,
  final_condition TEXT,
  total_cost NUMERIC DEFAULT 0,
  total_labor_hours NUMERIC DEFAULT 0,
  primary_technician TEXT,
  session_summary TEXT,
  initial_photos JSONB DEFAULT '[]'::jsonb,
  completion_photos JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint for session numbering per item
CREATE UNIQUE INDEX idx_maintenance_sessions_item_session 
ON public.maintenance_sessions(item_id, session_number);

-- Enable RLS on maintenance_sessions
ALTER TABLE public.maintenance_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for maintenance_sessions (similar to maintenance_updates)
CREATE POLICY "Allow read access to maintenance_sessions" 
ON public.maintenance_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert access to maintenance_sessions" 
ON public.maintenance_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update access to maintenance_sessions" 
ON public.maintenance_sessions 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete access to maintenance_sessions" 
ON public.maintenance_sessions 
FOR DELETE 
USING (true);

-- Create function to auto-increment session numbers per item
CREATE OR REPLACE FUNCTION public.set_maintenance_session_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-set session number if not provided
  IF NEW.session_number IS NULL THEN
    SELECT COALESCE(MAX(session_number), 0) + 1
    INTO NEW.session_number
    FROM public.maintenance_sessions
    WHERE item_id = NEW.item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-incrementing session numbers
CREATE TRIGGER set_maintenance_session_number_trigger
  BEFORE INSERT ON public.maintenance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_maintenance_session_number();

-- Create trigger for updating timestamps
CREATE TRIGGER update_maintenance_sessions_updated_at
  BEFORE UPDATE ON public.maintenance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create maintenance session when item goes to maintenance
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
      COALESCE(NEW.photos, '[]'::jsonb),
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

-- Create trigger for auto-creating maintenance sessions
CREATE TRIGGER create_maintenance_session_trigger
  AFTER UPDATE ON public.product_items
  FOR EACH ROW
  EXECUTE FUNCTION public.create_maintenance_session_on_status_change();

-- Backfill existing maintenance_updates with session IDs
-- Group existing updates by item_id and create sessions for them
DO $$
DECLARE
  item_record RECORD;
  session_id UUID;
BEGIN
  -- For each item that has maintenance updates but no sessions
  FOR item_record IN 
    SELECT DISTINCT mu.item_id, pi.item_code
    FROM public.maintenance_updates mu
    JOIN public.product_items pi ON pi.id = mu.item_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.maintenance_sessions ms WHERE ms.item_id = mu.item_id
    )
  LOOP
    -- Create a session for this item's historical updates
    INSERT INTO public.maintenance_sessions (
      item_id,
      initial_condition,
      primary_technician,
      session_summary,
      status,
      started_at
    ) VALUES (
      item_record.item_id,
      'legacy',
      'Historical Data',
      'Legacy maintenance session created during system upgrade',
      'completed',
      (SELECT MIN(created_at) FROM public.maintenance_updates WHERE item_id = item_record.item_id)
    ) RETURNING id INTO session_id;
    
    -- Update all maintenance_updates for this item to use the new session_id
    UPDATE public.maintenance_updates 
    SET maintenance_session_id = session_id
    WHERE item_id = item_record.item_id AND maintenance_session_id IS NULL;
  END LOOP;
END $$;