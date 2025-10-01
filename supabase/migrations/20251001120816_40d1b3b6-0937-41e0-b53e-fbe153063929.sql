-- Add cost field to spill kit template items
ALTER TABLE public.spill_kit_template_items 
ADD COLUMN IF NOT EXISTS unit_cost numeric DEFAULT 0.00;

COMMENT ON COLUMN public.spill_kit_template_items.unit_cost IS 'Cost per unit of this item, used for restock request estimation';