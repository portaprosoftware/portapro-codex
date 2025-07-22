
-- Create customer_notes table for the activity feed
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  user_id UUID,
  note_text TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for customer notes
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to customer notes" 
  ON public.customer_notes 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION public.update_customer_notes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE TRIGGER update_customer_notes_updated_at
    BEFORE UPDATE ON public.customer_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_customer_notes_updated_at();

-- Add missing customer_type column to customers table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' 
                   AND column_name = 'customer_type') THEN
        ALTER TABLE public.customers ADD COLUMN customer_type TEXT;
    END IF;
END $$;

-- Update customer_type column to use the enum values we have in types
UPDATE public.customers 
SET customer_type = COALESCE(type, 'commercial')
WHERE customer_type IS NULL;
