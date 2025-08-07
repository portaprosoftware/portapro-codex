-- Create maintenance_updates table
CREATE TABLE public.maintenance_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.product_items(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL CHECK (update_type IN ('progress', 'repair', 'parts', 'inspection')),
  description TEXT NOT NULL,
  technician TEXT,
  labor_hours NUMERIC,
  labor_cost NUMERIC,
  parts_cost NUMERIC,
  parts_used TEXT,
  cost_amount NUMERIC GENERATED ALWAYS AS (COALESCE(labor_cost, 0) + COALESCE(parts_cost, 0)) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add cost tracking columns to product_items
ALTER TABLE public.product_items 
ADD COLUMN IF NOT EXISTS total_maintenance_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_maintenance_update TIMESTAMP WITH TIME ZONE;

-- Create trigger to update product_items maintenance totals
CREATE OR REPLACE FUNCTION public.update_item_maintenance_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the item's total maintenance cost and last update timestamp
    UPDATE public.product_items 
    SET 
        total_maintenance_cost = (
            SELECT COALESCE(SUM(cost_amount), 0) 
            FROM public.maintenance_updates 
            WHERE item_id = COALESCE(NEW.item_id, OLD.item_id)
        ),
        last_maintenance_update = now()
    WHERE id = COALESCE(NEW.item_id, OLD.item_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for maintenance cost updates
CREATE TRIGGER maintenance_updates_cost_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_updates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_item_maintenance_totals();

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_maintenance_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_maintenance_updates_updated_at
    BEFORE UPDATE ON public.maintenance_updates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_maintenance_updates_updated_at();