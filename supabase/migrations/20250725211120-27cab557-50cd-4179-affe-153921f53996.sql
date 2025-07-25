-- Create storage locations table
CREATE TABLE public.storage_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address_type TEXT NOT NULL DEFAULT 'custom', -- 'company_address', 'custom', 'gps'
  company_address_id UUID,
  custom_street TEXT,
  custom_street2 TEXT,
  custom_city TEXT,
  custom_state TEXT,
  custom_zip TEXT,
  gps_coordinates POINT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create location stock tracking for products
CREATE TABLE public.product_location_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  storage_location_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, storage_location_id)
);

-- Create location stock tracking for consumables
CREATE TABLE public.consumable_location_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consumable_id UUID NOT NULL,
  storage_location_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(consumable_id, storage_location_id)
);

-- Add storage location to existing tables
ALTER TABLE public.products ADD COLUMN default_storage_location_id UUID;
ALTER TABLE public.consumables ADD COLUMN default_storage_location_id UUID;
ALTER TABLE public.product_items ADD COLUMN current_storage_location_id UUID;
ALTER TABLE public.equipment_assignments ADD COLUMN source_storage_location_id UUID;
ALTER TABLE public.consumable_stock_adjustments ADD COLUMN storage_location_id UUID;

-- Create foreign key relationships
ALTER TABLE public.product_location_stock 
ADD CONSTRAINT fk_product_location_stock_product 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.product_location_stock 
ADD CONSTRAINT fk_product_location_stock_location 
FOREIGN KEY (storage_location_id) REFERENCES public.storage_locations(id) ON DELETE CASCADE;

ALTER TABLE public.consumable_location_stock 
ADD CONSTRAINT fk_consumable_location_stock_consumable 
FOREIGN KEY (consumable_id) REFERENCES public.consumables(id) ON DELETE CASCADE;

ALTER TABLE public.consumable_location_stock 
ADD CONSTRAINT fk_consumable_location_stock_location 
FOREIGN KEY (storage_location_id) REFERENCES public.storage_locations(id) ON DELETE CASCADE;

-- Create triggers for updated_at
CREATE TRIGGER update_storage_locations_updated_at
  BEFORE UPDATE ON public.storage_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_location_stock_updated_at
  BEFORE UPDATE ON public.product_location_stock
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consumable_location_stock_updated_at
  BEFORE UPDATE ON public.consumable_location_stock
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_location_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumable_location_stock ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public access to storage locations" 
ON public.storage_locations FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access to product location stock" 
ON public.product_location_stock FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access to consumable location stock" 
ON public.consumable_location_stock FOR ALL USING (true) WITH CHECK (true);

-- Create default storage location from company settings
INSERT INTO public.storage_locations (name, description, address_type, is_default, is_active)
SELECT 
  'Main Location',
  'Default storage location created from company settings',
  'company_address',
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.storage_locations WHERE is_default = true);

-- Create function to sync location stock
CREATE OR REPLACE FUNCTION public.sync_location_stock_on_product_change()
RETURNS TRIGGER AS $$
DECLARE
  default_location_id UUID;
BEGIN
  -- Get the default storage location
  SELECT id INTO default_location_id 
  FROM public.storage_locations 
  WHERE is_default = true 
  LIMIT 1;
  
  IF default_location_id IS NOT NULL THEN
    -- For new products, create location stock entry
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.product_location_stock (product_id, storage_location_id, quantity)
      VALUES (NEW.id, default_location_id, NEW.stock_total)
      ON CONFLICT (product_id, storage_location_id) 
      DO UPDATE SET quantity = NEW.stock_total;
      
      -- Set default storage location
      UPDATE public.products 
      SET default_storage_location_id = default_location_id 
      WHERE id = NEW.id AND default_storage_location_id IS NULL;
    END IF;
    
    -- For updates, sync stock changes
    IF TG_OP = 'UPDATE' AND OLD.stock_total != NEW.stock_total THEN
      INSERT INTO public.product_location_stock (product_id, storage_location_id, quantity)
      VALUES (NEW.id, default_location_id, NEW.stock_total)
      ON CONFLICT (product_id, storage_location_id) 
      DO UPDATE SET quantity = NEW.stock_total;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to sync consumable location stock
CREATE OR REPLACE FUNCTION public.sync_consumable_location_stock_on_change()
RETURNS TRIGGER AS $$
DECLARE
  default_location_id UUID;
BEGIN
  -- Get the default storage location
  SELECT id INTO default_location_id 
  FROM public.storage_locations 
  WHERE is_default = true 
  LIMIT 1;
  
  IF default_location_id IS NOT NULL THEN
    -- For new consumables, create location stock entry
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.consumable_location_stock (consumable_id, storage_location_id, quantity)
      VALUES (NEW.id, default_location_id, NEW.on_hand_qty)
      ON CONFLICT (consumable_id, storage_location_id) 
      DO UPDATE SET quantity = NEW.on_hand_qty;
      
      -- Set default storage location
      UPDATE public.consumables 
      SET default_storage_location_id = default_location_id 
      WHERE id = NEW.id AND default_storage_location_id IS NULL;
    END IF;
    
    -- For updates, sync stock changes
    IF TG_OP = 'UPDATE' AND OLD.on_hand_qty != NEW.on_hand_qty THEN
      INSERT INTO public.consumable_location_stock (consumable_id, storage_location_id, quantity)
      VALUES (NEW.id, default_location_id, NEW.on_hand_qty)
      ON CONFLICT (consumable_id, storage_location_id) 
      DO UPDATE SET quantity = NEW.on_hand_qty;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER sync_product_location_stock
  AFTER INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_location_stock_on_product_change();

CREATE TRIGGER sync_consumable_location_stock
  AFTER INSERT OR UPDATE ON public.consumables
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_consumable_location_stock_on_change();

-- Migrate existing data to location-based system
DO $$
DECLARE
  default_location_id UUID;
  product_record RECORD;
  consumable_record RECORD;
BEGIN
  -- Get default location
  SELECT id INTO default_location_id 
  FROM public.storage_locations 
  WHERE is_default = true 
  LIMIT 1;
  
  IF default_location_id IS NOT NULL THEN
    -- Migrate existing products
    FOR product_record IN SELECT id, stock_total FROM public.products LOOP
      INSERT INTO public.product_location_stock (product_id, storage_location_id, quantity)
      VALUES (product_record.id, default_location_id, product_record.stock_total)
      ON CONFLICT (product_id, storage_location_id) DO NOTHING;
      
      -- Update product default location
      UPDATE public.products 
      SET default_storage_location_id = default_location_id 
      WHERE id = product_record.id AND default_storage_location_id IS NULL;
    END LOOP;
    
    -- Migrate existing consumables
    FOR consumable_record IN SELECT id, on_hand_qty FROM public.consumables LOOP
      INSERT INTO public.consumable_location_stock (consumable_id, storage_location_id, quantity)
      VALUES (consumable_record.id, default_location_id, consumable_record.on_hand_qty)
      ON CONFLICT (consumable_id, storage_location_id) DO NOTHING;
      
      -- Update consumable default location
      UPDATE public.consumables 
      SET default_storage_location_id = default_location_id 
      WHERE id = consumable_record.id AND default_storage_location_id IS NULL;
    END LOOP;
    
    -- Update existing product items
    UPDATE public.product_items 
    SET current_storage_location_id = default_location_id 
    WHERE current_storage_location_id IS NULL;
  END IF;
END $$;