-- 1. Restore get_compliance_notification_counts RPC function
CREATE OR REPLACE FUNCTION public.get_compliance_notification_counts(org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  expiring_licenses_count integer := 0;
  expiring_medical_cards_count integer := 0;
  expiring_vehicle_docs_count integer := 0;
  overdue_maintenance_count integer := 0;
  low_stock_count integer := 0;
BEGIN
  -- Count expiring driver licenses (within 30 days)
  SELECT COUNT(*) INTO expiring_licenses_count
  FROM public.driver_credentials dc
  JOIN public.profiles p ON dc.driver_id = p.id
  WHERE p.organization_id = org_id
    AND dc.license_expiry_date IS NOT NULL
    AND dc.license_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';
  
  -- Count expiring medical cards (within 30 days)
  SELECT COUNT(*) INTO expiring_medical_cards_count
  FROM public.driver_credentials dc
  JOIN public.profiles p ON dc.driver_id = p.id
  WHERE p.organization_id = org_id
    AND dc.medical_card_expiry_date IS NOT NULL
    AND dc.medical_card_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';
  
  -- Count expiring vehicle documents (within 30 days)
  SELECT COUNT(*) INTO expiring_vehicle_docs_count
  FROM public.vehicle_documents vd
  WHERE vd.organization_id = org_id
    AND vd.expiry_date IS NOT NULL
    AND vd.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';
  
  -- Count overdue maintenance work orders
  SELECT COUNT(*) INTO overdue_maintenance_count
  FROM public.work_orders wo
  WHERE wo.organization_id = org_id
    AND wo.status IN ('open', 'in_progress')
    AND wo.due_date < CURRENT_DATE;
  
  -- Count low stock consumables
  SELECT COUNT(*) INTO low_stock_count
  FROM public.consumables c
  WHERE c.organization_id = org_id
    AND c.is_active = true
    AND c.on_hand_qty <= c.reorder_threshold;
  
  result := jsonb_build_object(
    'expiring_licenses', expiring_licenses_count,
    'expiring_medical_cards', expiring_medical_cards_count,
    'expiring_vehicle_docs', expiring_vehicle_docs_count,
    'overdue_maintenance', overdue_maintenance_count,
    'low_stock', low_stock_count,
    'total', expiring_licenses_count + expiring_medical_cards_count + expiring_vehicle_docs_count + overdue_maintenance_count + low_stock_count
  );
  
  RETURN result;
END;
$$;

-- 2. Create vehicle-images storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Create RLS policies for vehicle-images bucket
DROP POLICY IF EXISTS "Public read access for vehicle images" ON storage.objects;
CREATE POLICY "Public read access for vehicle images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vehicle-images');

DROP POLICY IF EXISTS "Authenticated users can upload vehicle images" ON storage.objects;
CREATE POLICY "Authenticated users can upload vehicle images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-images');

DROP POLICY IF EXISTS "Users can update their org vehicle images" ON storage.objects;
CREATE POLICY "Users can update their org vehicle images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vehicle-images');

DROP POLICY IF EXISTS "Users can delete their org vehicle images" ON storage.objects;
CREATE POLICY "Users can delete their org vehicle images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-images');

-- 4. Enable realtime for critical tables
ALTER TABLE public.product_items REPLICA IDENTITY FULL;
ALTER TABLE public.vehicles REPLICA IDENTITY FULL;
ALTER TABLE public.equipment_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.customers REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DO $$
BEGIN
  -- Add product_items if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'product_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_items;
  END IF;

  -- Add vehicles if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'vehicles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
  END IF;

  -- Add equipment_assignments if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'equipment_assignments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment_assignments;
  END IF;

  -- Add customers if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'customers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
  END IF;
END $$;