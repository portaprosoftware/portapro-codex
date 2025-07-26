-- Phase 1: Create missing foundation tables

-- Create products table (referenced by equipment_assignments, job_items, product_location_stock)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  base_price NUMERIC DEFAULT 0,
  stock_total INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create vehicles table (referenced by maintenance records, fuel logs, etc.)
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  vin TEXT,
  status TEXT DEFAULT 'active',
  last_known_location POINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create maintenance_report_templates table (referenced by routine_maintenance_services)
CREATE TABLE IF NOT EXISTS public.maintenance_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_content JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create product_items table if it doesn't exist (referenced by equipment_assignments, qr_feedback)
CREATE TABLE IF NOT EXISTS public.product_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID,
  item_code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'available',
  last_known_location POINT,
  color TEXT,
  size TEXT,
  material TEXT,
  winterized BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create qr_feedback table if it doesn't exist (referenced in errors)
CREATE TABLE IF NOT EXISTS public.qr_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID,
  feedback_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create consumable_stock_adjustments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.consumable_stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumable_id UUID,
  adjustment_type TEXT,
  quantity_change INTEGER,
  previous_quantity INTEGER,
  new_quantity INTEGER,
  reason TEXT,
  adjusted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Phase 2: Clean up orphaned data before adding foreign key constraints

-- Remove orphaned equipment_assignments that reference non-existent jobs
DELETE FROM public.equipment_assignments 
WHERE job_id NOT IN (SELECT id FROM public.jobs);

-- Remove orphaned equipment_assignments that reference non-existent product_items
DELETE FROM public.equipment_assignments 
WHERE product_item_id IS NOT NULL 
AND product_item_id NOT IN (SELECT id FROM public.product_items);

-- Remove orphaned job_consumables that reference non-existent jobs
DELETE FROM public.job_consumables 
WHERE job_id NOT IN (SELECT id FROM public.jobs);

-- Remove orphaned job_consumables that reference non-existent consumables
DELETE FROM public.job_consumables 
WHERE consumable_id NOT IN (SELECT id FROM public.consumables);

-- Remove orphaned product_location_stock that reference non-existent storage_locations
DELETE FROM public.product_location_stock 
WHERE storage_location_id NOT IN (SELECT id FROM public.storage_locations);

-- Remove orphaned driver_time_off_requests that reference non-existent profiles
DELETE FROM public.driver_time_off_requests 
WHERE driver_id NOT IN (SELECT id FROM public.profiles);

-- Remove orphaned user_roles that reference non-existent profiles
DELETE FROM public.user_roles 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Update jobs with invalid driver_id to NULL
UPDATE public.jobs 
SET driver_id = NULL 
WHERE driver_id IS NOT NULL 
AND driver_id NOT IN (SELECT id FROM public.profiles);

-- Phase 3: Add foreign key constraints in dependency order

-- Profile relationships
ALTER TABLE public.jobs 
ADD CONSTRAINT fk_jobs_driver_id 
FOREIGN KEY (driver_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.driver_time_off_requests 
ADD CONSTRAINT fk_driver_time_off_requests_driver_id 
FOREIGN KEY (driver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_roles 
ADD CONSTRAINT fk_user_roles_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Product relationships
ALTER TABLE public.product_items 
ADD CONSTRAINT fk_product_items_product_id 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.equipment_assignments 
ADD CONSTRAINT fk_equipment_assignments_product_id 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.equipment_assignments 
ADD CONSTRAINT fk_equipment_assignments_product_item_id 
FOREIGN KEY (product_item_id) REFERENCES public.product_items(id) ON DELETE CASCADE;

ALTER TABLE public.product_location_stock 
ADD CONSTRAINT fk_product_location_stock_product_id 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Job relationships
ALTER TABLE public.equipment_assignments 
ADD CONSTRAINT fk_equipment_assignments_job_id 
FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

ALTER TABLE public.job_consumables 
ADD CONSTRAINT fk_job_consumables_job_id 
FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

-- Storage relationships
ALTER TABLE public.product_location_stock 
ADD CONSTRAINT fk_product_location_stock_storage_location_id 
FOREIGN KEY (storage_location_id) REFERENCES public.storage_locations(id) ON DELETE CASCADE;

-- Consumables relationships
ALTER TABLE public.job_consumables 
ADD CONSTRAINT fk_job_consumables_consumable_id 
FOREIGN KEY (consumable_id) REFERENCES public.consumables(id) ON DELETE CASCADE;

ALTER TABLE public.consumable_stock_adjustments 
ADD CONSTRAINT fk_consumable_stock_adjustments_consumable_id 
FOREIGN KEY (consumable_id) REFERENCES public.consumables(id) ON DELETE CASCADE;

-- Template relationships
ALTER TABLE public.routine_maintenance_services 
ADD CONSTRAINT fk_routine_maintenance_services_default_template_id 
FOREIGN KEY (default_template_id) REFERENCES public.maintenance_report_templates(id) ON DELETE SET NULL;

-- QR Feedback relationships
ALTER TABLE public.qr_feedback 
ADD CONSTRAINT fk_qr_feedback_unit_id 
FOREIGN KEY (unit_id) REFERENCES public.product_items(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumable_stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies for all new tables
CREATE POLICY "Public access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to maintenance_report_templates" ON public.maintenance_report_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to product_items" ON public.product_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to qr_feedback" ON public.qr_feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to consumable_stock_adjustments" ON public.consumable_stock_adjustments FOR ALL USING (true) WITH CHECK (true);

-- Add update triggers for new tables
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_report_templates_updated_at
  BEFORE UPDATE ON public.maintenance_report_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_items_updated_at
  BEFORE UPDATE ON public.product_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();