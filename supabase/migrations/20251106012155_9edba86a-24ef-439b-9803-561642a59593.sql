-- Add organization_id column to all tenant-scoped tables
ALTER TABLE customers ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE product_items ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE consumables ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE job_items ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE equipment_assignments ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_contacts ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_notes ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE vehicle_assignments ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE vehicle_documents ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE vehicle_damage_logs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE spill_incidents ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE decon_logs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE dvir_reports ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE job_consumables ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE consumable_bundles ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE stock_adjustments ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE campaign_drafts ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE filter_presets ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE daily_vehicle_assignments ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE driver_working_hours ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Create indexes for organization_id (performance optimization)
CREATE INDEX IF NOT EXISTS idx_customers_org_id ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_jobs_org_id ON jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_org_id ON vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_org_id ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_items_org_id ON product_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_consumables_org_id ON consumables(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotes_org_id ON quotes(organization_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_org_id ON fuel_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org_id ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_org_id ON company_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assignments_org_id ON equipment_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_org_id ON customer_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_org_id ON customer_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_dvir_reports_org_id ON dvir_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_org_id ON work_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_org_id ON services(organization_id);

-- Backfill existing data with demo organization ID
-- This uses a placeholder org ID - you'll update this with actual Clerk org IDs later
DO $$
BEGIN
  -- Update all tables with demo org ID (portapro-demo)
  UPDATE customers SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE jobs SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE vehicles SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE product_items SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE products SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE consumables SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE invoices SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE quotes SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE fuel_logs SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE maintenance_records SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE profiles SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE user_roles SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE company_settings SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE job_items SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE invoice_items SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE quote_items SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE equipment_assignments SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE customer_contacts SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE customer_notes SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE vehicle_assignments SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE vehicle_documents SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE vehicle_damage_logs SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE spill_incidents SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE decon_logs SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE dvir_reports SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE work_orders SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE services SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE job_consumables SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE consumable_bundles SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE stock_adjustments SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE campaign_drafts SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE filter_presets SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE notification_logs SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE daily_vehicle_assignments SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
  UPDATE driver_working_hours SET organization_id = 'portapro-demo' WHERE organization_id IS NULL;
END $$;

-- After backfill verification, uncomment these to enforce NOT NULL constraint:
-- ALTER TABLE customers ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE jobs ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE vehicles ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE products ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE invoices ALTER COLUMN organization_id SET NOT NULL;
-- (repeat for all tables)