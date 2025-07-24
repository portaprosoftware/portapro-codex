-- Create vehicle damage logs table
CREATE TABLE public.vehicle_damage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  damage_type TEXT NOT NULL DEFAULT 'general',
  description TEXT NOT NULL,
  image_path TEXT,
  severity TEXT NOT NULL DEFAULT 'minor',
  reported_by UUID,
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'open'
);

-- Enable RLS
ALTER TABLE public.vehicle_damage_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public access to vehicle damage logs" 
ON public.vehicle_damage_logs 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_vehicle_damage_logs_updated_at
BEFORE UPDATE ON public.vehicle_damage_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for damage images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-damage-images', 'vehicle-damage-images', true);

-- Create storage policies for damage images
CREATE POLICY "Vehicle damage images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vehicle-damage-images');

CREATE POLICY "Users can upload vehicle damage images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'vehicle-damage-images');

CREATE POLICY "Users can update vehicle damage images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'vehicle-damage-images');

CREATE POLICY "Users can delete vehicle damage images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'vehicle-damage-images');