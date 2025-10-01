-- Add additional fields to spill_kit_inventory for better management
ALTER TABLE public.spill_kit_inventory
ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'absorbent',
ADD COLUMN IF NOT EXISTS reorder_quantity INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS supplier_name TEXT,
ADD COLUMN IF NOT EXISTS supplier_contact TEXT,
ADD COLUMN IF NOT EXISTS supplier_sku TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for item_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_spill_kit_inventory_item_type ON public.spill_kit_inventory(item_type);

-- Create index for low stock items
CREATE INDEX IF NOT EXISTS idx_spill_kit_inventory_low_stock ON public.spill_kit_inventory(current_stock, minimum_threshold);