-- Create spill_kit_storage_locations table (similar to storage_locations)
CREATE TABLE IF NOT EXISTS public.spill_kit_storage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('warehouse', 'vehicle', 'facility', 'mobile', 'other')),
  address_type TEXT NOT NULL DEFAULT 'custom' CHECK (address_type IN ('company', 'custom', 'gps')),
  address_company BOOLEAN DEFAULT false,
  address_custom TEXT,
  address_gps_lat NUMERIC,
  address_gps_lng NUMERIC,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  capacity_limit INTEGER,
  contact_person TEXT,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create spill_kit_location_stock table
CREATE TABLE IF NOT EXISTS public.spill_kit_location_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES public.spill_kit_inventory(id) ON DELETE CASCADE,
  storage_location_id UUID NOT NULL REFERENCES public.spill_kit_storage_locations(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 0,
  last_counted_at TIMESTAMP WITH TIME ZONE,
  last_counted_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(inventory_item_id, storage_location_id)
);

-- Create spill_kit_stock_transfers table
CREATE TABLE IF NOT EXISTS public.spill_kit_stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES public.spill_kit_inventory(id) ON DELETE CASCADE,
  from_location_id UUID REFERENCES public.spill_kit_storage_locations(id) ON DELETE SET NULL,
  to_location_id UUID NOT NULL REFERENCES public.spill_kit_storage_locations(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  transfer_reason TEXT,
  transferred_by TEXT,
  transferred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_spill_kit_location_stock_inventory ON public.spill_kit_location_stock(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_spill_kit_location_stock_location ON public.spill_kit_location_stock(storage_location_id);
CREATE INDEX IF NOT EXISTS idx_spill_kit_storage_locations_type ON public.spill_kit_storage_locations(location_type);
CREATE INDEX IF NOT EXISTS idx_spill_kit_storage_locations_vehicle ON public.spill_kit_storage_locations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_spill_kit_stock_transfers_item ON public.spill_kit_stock_transfers(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_spill_kit_stock_transfers_from ON public.spill_kit_stock_transfers(from_location_id);
CREATE INDEX IF NOT EXISTS idx_spill_kit_stock_transfers_to ON public.spill_kit_stock_transfers(to_location_id);

-- Enable RLS
ALTER TABLE public.spill_kit_storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spill_kit_location_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spill_kit_stock_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all operations on spill_kit_storage_locations"
  ON public.spill_kit_storage_locations
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on spill_kit_location_stock"
  ON public.spill_kit_location_stock
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on spill_kit_stock_transfers"
  ON public.spill_kit_stock_transfers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_spill_kit_location_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_spill_kit_storage_locations_updated_at
  BEFORE UPDATE ON public.spill_kit_storage_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_spill_kit_location_updated_at();

CREATE TRIGGER update_spill_kit_location_stock_updated_at
  BEFORE UPDATE ON public.spill_kit_location_stock
  FOR EACH ROW
  EXECUTE FUNCTION update_spill_kit_location_updated_at();