-- Add parent_work_order_id column to maintenance_updates table
ALTER TABLE public.maintenance_updates 
ADD COLUMN parent_work_order_id UUID REFERENCES public.maintenance_updates(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_maintenance_updates_parent ON public.maintenance_updates(parent_work_order_id);

-- Add comment for clarity
COMMENT ON COLUMN public.maintenance_updates.parent_work_order_id IS 'References parent work order when this record is a progress update/child record';