-- Add new columns to spill_kit_inventory for enhanced tracking
ALTER TABLE public.spill_kit_inventory
ADD COLUMN IF NOT EXISTS expiration_date date,
ADD COLUMN IF NOT EXISTS lot_batch_number text,
ADD COLUMN IF NOT EXISTS linked_template_ids jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_critical boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS supplier_portal_url text,
ADD COLUMN IF NOT EXISTS last_usage_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0;

-- Create usage log table
CREATE TABLE IF NOT EXISTS public.spill_kit_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL REFERENCES public.spill_kit_inventory(id) ON DELETE CASCADE,
  quantity_used integer NOT NULL,
  used_at timestamp with time zone NOT NULL DEFAULT now(),
  used_by_clerk text,
  incident_id uuid,
  vehicle_id uuid REFERENCES public.vehicles(id),
  check_id uuid REFERENCES public.vehicle_spill_kit_checks(id),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_spill_kit_usage_log_inventory_item ON public.spill_kit_usage_log(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_spill_kit_usage_log_used_at ON public.spill_kit_usage_log(used_at);
CREATE INDEX IF NOT EXISTS idx_spill_kit_inventory_expiration ON public.spill_kit_inventory(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_spill_kit_inventory_critical ON public.spill_kit_inventory(is_critical) WHERE is_critical = true;

-- Enable RLS on usage log
ALTER TABLE public.spill_kit_usage_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for usage log
CREATE POLICY "Allow all operations on spill_kit_usage_log"
ON public.spill_kit_usage_log
FOR ALL
USING (true)
WITH CHECK (true);