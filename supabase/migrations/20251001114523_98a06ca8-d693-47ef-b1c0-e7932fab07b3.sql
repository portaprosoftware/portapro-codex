-- Create vehicle_spill_kits table for tracking spill kit assignments to vehicles
CREATE TABLE IF NOT EXISTS public.vehicle_spill_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  kit_identifier TEXT,
  required_contents JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_inspection_date TIMESTAMP WITH TIME ZONE,
  next_inspection_due TIMESTAMP WITH TIME ZONE,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster vehicle lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_spill_kits_vehicle_id ON public.vehicle_spill_kits(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_spill_kits_active ON public.vehicle_spill_kits(active);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_vehicle_spill_kits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicle_spill_kits_updated_at
  BEFORE UPDATE ON public.vehicle_spill_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_spill_kits_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.vehicle_spill_kits IS 'Tracks spill kit assignments and required contents for fleet vehicles';
COMMENT ON COLUMN public.vehicle_spill_kits.required_contents IS 'JSON array of inventory items: [{inventory_item_id: uuid, item_name: text, quantity_required: number, assigned_at: timestamp}]';