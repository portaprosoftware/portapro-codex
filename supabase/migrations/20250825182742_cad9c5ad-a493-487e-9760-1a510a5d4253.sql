-- Create customer_notes table
CREATE TABLE public.customer_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  note_type TEXT NOT NULL CHECK (note_type IN ('general', 'service', 'communication')),
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

-- Create policies (no RLS restrictions as per instructions)
CREATE POLICY "Allow all operations on customer_notes" 
ON public.customer_notes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_customer_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_customer_notes_updated_at
  BEFORE UPDATE ON public.customer_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_notes_updated_at();

-- Add index for better performance
CREATE INDEX idx_customer_notes_customer_id ON public.customer_notes(customer_id);
CREATE INDEX idx_customer_notes_type ON public.customer_notes(note_type);