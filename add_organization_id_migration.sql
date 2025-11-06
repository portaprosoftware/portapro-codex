-- =====================================================
-- MULTI-TENANT MIGRATION: Add organization_id to all tables
-- =====================================================
-- This migration adds organization_id column to all business tables
-- to support multi-tenant data isolation in a single Supabase project.
-- Each Vercel deployment (e.g., smith-rentals.portaprosoftware.com) 
-- will filter data by their unique Clerk organization slug.
-- 
-- TO RUN: Copy this entire script and execute it in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PHASE 1: Add organization_id column to all tables
-- =====================================================

-- Core Business Tables
ALTER TABLE customers ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_contacts ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_contracts ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_interaction_logs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_map_pins ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_notes ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_portal_tokens ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_segments ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_service_locations ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_stats ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_categories ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_communications ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Jobs & Quotes
ALTER TABLE active_quotes ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Inventory & Products
ALTER TABLE products ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE consumables ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE consumable_location_stock ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE consumable_stock_adjustments ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE consumable_stock_ledger ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE consumable_bundles ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE consumable_bundle_items ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE consumable_notification_settings ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Fleet & Compliance
ALTER TABLE disposal_manifests ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE decon_logs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE daily_vehicle_assignments ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE daily_vehicle_loads ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Communications & Marketing
ALTER TABLE communication_templates ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE campaign_analytics ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE campaign_drafts ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Company & Settings
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE company_maintenance_settings ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Certification & Documents
ALTER TABLE certification_types ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE compliance_document_types ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE document_categories ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE document_notification_settings ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Configuration & Settings
ALTER TABLE configurable_spill_types ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE custom_reports ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE dashboard_configurations ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Scheduling & Availability
ALTER TABLE availability_calendar ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE coordinate_equipment_assignments ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Activity Logs
ALTER TABLE driver_activity_log ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE delivery_audit_log ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- User Management
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Automation
ALTER TABLE automation_requests ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- =====================================================
-- PHASE 2: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_organization_id ON customer_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_contracts_organization_id ON customer_contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_interaction_logs_organization_id ON customer_interaction_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_map_pins_organization_id ON customer_map_pins(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_organization_id ON customer_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_portal_tokens_organization_id ON customer_portal_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_segments_organization_id ON customer_segments(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_service_locations_organization_id ON customer_service_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_stats_organization_id ON customer_stats(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_categories_organization_id ON customer_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_organization_id ON customer_communications(organization_id);
CREATE INDEX IF NOT EXISTS idx_active_quotes_organization_id ON active_quotes(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_organization_id ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_consumables_organization_id ON consumables(organization_id);
CREATE INDEX IF NOT EXISTS idx_consumable_location_stock_organization_id ON consumable_location_stock(organization_id);
CREATE INDEX IF NOT EXISTS idx_consumable_stock_adjustments_organization_id ON consumable_stock_adjustments(organization_id);
CREATE INDEX IF NOT EXISTS idx_consumable_stock_ledger_organization_id ON consumable_stock_ledger(organization_id);
CREATE INDEX IF NOT EXISTS idx_consumable_bundles_organization_id ON consumable_bundles(organization_id);
CREATE INDEX IF NOT EXISTS idx_consumable_bundle_items_organization_id ON consumable_bundle_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_consumable_notification_settings_organization_id ON consumable_notification_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_disposal_manifests_organization_id ON disposal_manifests(organization_id);
CREATE INDEX IF NOT EXISTS idx_decon_logs_organization_id ON decon_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_vehicle_assignments_organization_id ON daily_vehicle_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_vehicle_loads_organization_id ON daily_vehicle_loads(organization_id);
CREATE INDEX IF NOT EXISTS idx_communication_templates_organization_id ON communication_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_organization_id ON campaign_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_drafts_organization_id ON campaign_drafts(organization_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_organization_id ON company_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_company_maintenance_settings_organization_id ON company_maintenance_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_organization_id ON business_hours(organization_id);
CREATE INDEX IF NOT EXISTS idx_certification_types_organization_id ON certification_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_document_types_organization_id ON compliance_document_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_categories_organization_id ON document_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_notification_settings_organization_id ON document_notification_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_configurable_spill_types_organization_id ON configurable_spill_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_reports_organization_id ON custom_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_configurations_organization_id ON dashboard_configurations(organization_id);
CREATE INDEX IF NOT EXISTS idx_availability_calendar_organization_id ON availability_calendar(organization_id);
CREATE INDEX IF NOT EXISTS idx_coordinate_equipment_assignments_organization_id ON coordinate_equipment_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_driver_activity_log_organization_id ON driver_activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_delivery_audit_log_organization_id ON delivery_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_requests_organization_id ON automation_requests(organization_id);

-- =====================================================
-- PHASE 3: Backfill existing data with demo org ID
-- =====================================================
-- IMPORTANT: Replace 'portapro-demo' with your actual Clerk organization slug
-- Find it in: Clerk Dashboard → Organizations → Your Demo Org → Settings → Slug

DO $$
DECLARE
  demo_org_id TEXT := 'portapro-demo'; -- ⚠️ CHANGE THIS to your actual Clerk org slug
BEGIN
  UPDATE customers SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE customer_contacts SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE customer_contracts SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE customer_interaction_logs SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE customer_map_pins SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE customer_notes SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE customer_portal_tokens SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE customer_segments SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE customer_service_locations SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE customer_stats SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE customer_categories SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE customer_communications SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE active_quotes SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE products SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE consumables SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE consumable_location_stock SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE consumable_stock_adjustments SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE consumable_stock_ledger SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE consumable_bundles SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE consumable_bundle_items SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE consumable_notification_settings SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE disposal_manifests SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE decon_logs SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE daily_vehicle_assignments SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE daily_vehicle_loads SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE communication_templates SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE campaign_analytics SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE campaign_drafts SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE company_settings SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE company_maintenance_settings SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE business_hours SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE certification_types SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE compliance_document_types SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE document_categories SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE document_notification_settings SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE configurable_spill_types SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE custom_reports SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE dashboard_configurations SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE availability_calendar SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE coordinate_equipment_assignments SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE driver_activity_log SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE delivery_audit_log SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE profiles SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE user_roles SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE automation_requests SET organization_id = demo_org_id WHERE organization_id IS NULL;

  RAISE NOTICE 'Backfilled all existing data with organization_id: %', demo_org_id;
END $$;

-- =====================================================
-- PHASE 4: Make organization_id NOT NULL
-- =====================================================
-- ⚠️ ONLY RUN AFTER verifying backfill was successful!

ALTER TABLE customers ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE customer_contacts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE customer_contracts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE customer_interaction_logs ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE customer_map_pins ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE customer_notes ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE customer_portal_tokens ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE customer_segments ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE customer_service_locations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE customer_stats ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE customer_categories ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE customer_communications ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE active_quotes ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE products ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE consumables ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE consumable_location_stock ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE consumable_stock_adjustments ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE consumable_stock_ledger ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE consumable_bundles ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE consumable_bundle_items ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE consumable_notification_settings ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE disposal_manifests ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE decon_logs ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE daily_vehicle_assignments ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE daily_vehicle_loads ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE communication_templates ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE campaign_analytics ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE campaign_drafts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE company_settings ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE company_maintenance_settings ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE business_hours ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE certification_types ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE compliance_document_types ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE document_categories ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE document_notification_settings ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE configurable_spill_types ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE custom_reports ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE dashboard_configurations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE availability_calendar ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE coordinate_equipment_assignments ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE driver_activity_log ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE delivery_audit_log ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE user_roles ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE automation_requests ALTER COLUMN organization_id SET NOT NULL;

-- =====================================================
-- 🎯 NEXT STEPS
-- =====================================================
-- 1. Go to Clerk Dashboard → find your demo organization slug
-- 2. Replace 'portapro-demo' above with your actual slug
-- 3. Copy this entire script and run in Supabase SQL Editor
-- 4. Verify: SELECT organization_id, COUNT(*) FROM customers GROUP BY organization_id;
-- 5. Update React hooks to filter by organization_id (next phase)
-- =====================================================
