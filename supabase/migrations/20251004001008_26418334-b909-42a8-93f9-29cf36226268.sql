-- Create vehicle_notes table
CREATE TABLE public.vehicle_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  title TEXT,
  note_text TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT,
  user_id UUID
);

-- Add indexes for performance
CREATE INDEX idx_vehicle_notes_vehicle_id ON public.vehicle_notes(vehicle_id);
CREATE INDEX idx_vehicle_notes_created_at ON public.vehicle_notes(created_at DESC);

-- Enable RLS
ALTER TABLE public.vehicle_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for now, matching customer_notes pattern)
CREATE POLICY "Allow all operations on vehicle_notes" 
ON public.vehicle_notes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add trigger to auto-update updated_at
CREATE TRIGGER update_vehicle_notes_updated_at
BEFORE UPDATE ON public.vehicle_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();