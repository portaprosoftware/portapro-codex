-- Add service_location_id column to customer_map_pins table
-- This allows pins to be optionally associated with a physical address for organizational purposes

ALTER TABLE public.customer_map_pins 
ADD COLUMN IF NOT EXISTS service_location_id UUID REFERENCES public.customer_service_locations(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_customer_map_pins_service_location_id 
ON public.customer_map_pins(service_location_id);

-- Add comment to explain the column purpose
COMMENT ON COLUMN public.customer_map_pins.service_location_id IS 'Optional reference to a physical service location for organizing pins. Pins can be standalone (NULL) or grouped under a service location.';