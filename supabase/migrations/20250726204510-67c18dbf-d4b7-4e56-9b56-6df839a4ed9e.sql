-- Phase 1: Create missing foundation tables (only if they don't exist)

DO $$ 
BEGIN
  -- Create products table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    CREATE TABLE public.products (
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
    
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Public access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);
    
    CREATE TRIGGER update_products_updated_at
      BEFORE UPDATE ON public.products
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- Create vehicles table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles') THEN
    CREATE TABLE public.vehicles (
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
    
    ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Public access to vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);
  ELSE
    -- Add trigger only if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = 'update_vehicles_updated_at') THEN
      CREATE TRIGGER update_vehicles_updated_at
        BEFORE UPDATE ON public.vehicles
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;

  -- Create maintenance_report_templates table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'maintenance_report_templates') THEN
    CREATE TABLE public.maintenance_report_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      template_content JSONB DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    ALTER TABLE public.maintenance_report_templates ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Public access to maintenance_report_templates" ON public.maintenance_report_templates FOR ALL USING (true) WITH CHECK (true);
    
    CREATE TRIGGER update_maintenance_report_templates_updated_at
      BEFORE UPDATE ON public.maintenance_report_templates
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- Create product_items table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_items') THEN
    CREATE TABLE public.product_items (
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
    
    ALTER TABLE public.product_items ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Public access to product_items" ON public.product_items FOR ALL USING (true) WITH CHECK (true);
    
    CREATE TRIGGER update_product_items_updated_at
      BEFORE UPDATE ON public.product_items
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- Create qr_feedback table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'qr_feedback') THEN
    CREATE TABLE public.qr_feedback (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      unit_id UUID,
      feedback_data JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    ALTER TABLE public.qr_feedback ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Public access to qr_feedback" ON public.qr_feedback FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Create consumable_stock_adjustments table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consumable_stock_adjustments') THEN
    CREATE TABLE public.consumable_stock_adjustments (
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
    
    ALTER TABLE public.consumable_stock_adjustments ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Public access to consumable_stock_adjustments" ON public.consumable_stock_adjustments FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Phase 2: Clean up orphaned data before adding foreign key constraints

-- Remove orphaned equipment_assignments that reference non-existent jobs
DELETE FROM public.equipment_assignments 
WHERE job_id IS NOT NULL AND job_id NOT IN (SELECT id FROM public.jobs);

-- Remove orphaned equipment_assignments that reference non-existent product_items
DELETE FROM public.equipment_assignments 
WHERE product_item_id IS NOT NULL 
AND product_item_id NOT IN (SELECT id FROM public.product_items);

-- Remove orphaned job_consumables that reference non-existent jobs
DELETE FROM public.job_consumables 
WHERE job_id IS NOT NULL AND job_id NOT IN (SELECT id FROM public.jobs);

-- Remove orphaned job_consumables that reference non-existent consumables
DELETE FROM public.job_consumables 
WHERE consumable_id IS NOT NULL AND consumable_id NOT IN (SELECT id FROM public.consumables);

-- Remove orphaned product_location_stock that reference non-existent storage_locations
DELETE FROM public.product_location_stock 
WHERE storage_location_id IS NOT NULL AND storage_location_id NOT IN (SELECT id FROM public.storage_locations);

-- Remove orphaned driver_time_off_requests that reference non-existent profiles
DELETE FROM public.driver_time_off_requests 
WHERE driver_id IS NOT NULL AND driver_id NOT IN (SELECT id FROM public.profiles);

-- Remove orphaned user_roles that reference non-existent profiles
DELETE FROM public.user_roles 
WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM public.profiles);

-- Update jobs with invalid driver_id to NULL
UPDATE public.jobs 
SET driver_id = NULL 
WHERE driver_id IS NOT NULL 
AND driver_id NOT IN (SELECT id FROM public.profiles);

-- Phase 3: Add foreign key constraints (only if they don't exist)

DO $$
BEGIN
  -- Profile relationships
  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_jobs_driver_id') THEN
    ALTER TABLE public.jobs 
    ADD CONSTRAINT fk_jobs_driver_id 
    FOREIGN KEY (driver_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_driver_time_off_requests_driver_id') THEN
    ALTER TABLE public.driver_time_off_requests 
    ADD CONSTRAINT fk_driver_time_off_requests_driver_id 
    FOREIGN KEY (driver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_user_roles_user_id') THEN
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT fk_user_roles_user_id 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- Product relationships
  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_product_items_product_id') THEN
    ALTER TABLE public.product_items 
    ADD CONSTRAINT fk_product_items_product_id 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_equipment_assignments_product_id') THEN
    ALTER TABLE public.equipment_assignments 
    ADD CONSTRAINT fk_equipment_assignments_product_id 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_equipment_assignments_product_item_id') THEN
    ALTER TABLE public.equipment_assignments 
    ADD CONSTRAINT fk_equipment_assignments_product_item_id 
    FOREIGN KEY (product_item_id) REFERENCES public.product_items(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_product_location_stock_product_id') THEN
    ALTER TABLE public.product_location_stock 
    ADD CONSTRAINT fk_product_location_stock_product_id 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;

  -- Job relationships
  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_equipment_assignments_job_id') THEN
    ALTER TABLE public.equipment_assignments 
    ADD CONSTRAINT fk_equipment_assignments_job_id 
    FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_job_consumables_job_id') THEN
    ALTER TABLE public.job_consumables 
    ADD CONSTRAINT fk_job_consumables_job_id 
    FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
  END IF;

  -- Storage relationships
  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_product_location_stock_storage_location_id') THEN
    ALTER TABLE public.product_location_stock 
    ADD CONSTRAINT fk_product_location_stock_storage_location_id 
    FOREIGN KEY (storage_location_id) REFERENCES public.storage_locations(id) ON DELETE CASCADE;
  END IF;

  -- Consumables relationships
  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_job_consumables_consumable_id') THEN
    ALTER TABLE public.job_consumables 
    ADD CONSTRAINT fk_job_consumables_consumable_id 
    FOREIGN KEY (consumable_id) REFERENCES public.consumables(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_consumable_stock_adjustments_consumable_id') THEN
    ALTER TABLE public.consumable_stock_adjustments 
    ADD CONSTRAINT fk_consumable_stock_adjustments_consumable_id 
    FOREIGN KEY (consumable_id) REFERENCES public.consumables(id) ON DELETE CASCADE;
  END IF;

  -- Template relationships
  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_routine_maintenance_services_default_template_id') THEN
    ALTER TABLE public.routine_maintenance_services 
    ADD CONSTRAINT fk_routine_maintenance_services_default_template_id 
    FOREIGN KEY (default_template_id) REFERENCES public.maintenance_report_templates(id) ON DELETE SET NULL;
  END IF;

  -- QR Feedback relationships
  IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_qr_feedback_unit_id') THEN
    ALTER TABLE public.qr_feedback 
    ADD CONSTRAINT fk_qr_feedback_unit_id 
    FOREIGN KEY (unit_id) REFERENCES public.product_items(id) ON DELETE CASCADE;
  END IF;
END $$;