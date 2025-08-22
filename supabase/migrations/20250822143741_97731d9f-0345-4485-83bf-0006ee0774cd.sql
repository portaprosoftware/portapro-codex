-- Create table for customer reference map pins
CREATE TABLE public.customer_map_pins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  pin_id text NOT NULL, -- The frontend-generated pin ID
  longitude numeric NOT NULL,
  latitude numeric NOT NULL,
  label text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ensure unique pin_id per customer
  UNIQUE(customer_id, pin_id)
);

-- Enable RLS
ALTER TABLE public.customer_map_pins ENABLE ROW LEVEL SECURITY;

-- Create policies (no auth restrictions since you mentioned no RLS)
CREATE POLICY "Allow all operations on customer_map_pins" 
ON public.customer_map_pins 
FOR ALL 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_customer_map_pins_updated_at
  BEFORE UPDATE ON public.customer_map_pins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_customer_map_pins_customer_id ON public.customer_map_pins(customer_id);