-- Migration: Add organization_id to all tables for multi-tenant data isolation
-- This migration adds organization_id column to 130+ tables that are missing it
-- and creates indexes for query performance
--
-- INSTRUCTIONS:
-- 1. Copy this entire file
-- 2. Run it in your Supabase SQL Editor
-- 3. Verify with the audit queries at the bottom
-- 4. Update your hooks to include organization_id in INSERT/SELECT operations

-- ============================================================================
-- PART 1: Add organization_id column to tables that don't have it
-- ============================================================================

-- Training & Certification Tables
ALTER TABLE certification_types ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE employee_certifications ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE training_requirements ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE employee_training_records ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Scheduling Tables
ALTER TABLE driver_shifts ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE shift_templates ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Work Order Related Tables
ALTER TABLE work_order_history ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE work_order_items ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE work_order_parts ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE work_order_labor ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Maintenance Tables
ALTER TABLE maintenance_tasks ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE maintenance_parts ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE maintenance_task_items ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Fuel Management Tables
ALTER TABLE fuel_tanks ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE fuel_stations ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE fuel_suppliers ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE mobile_fuel_services ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE fuel_price_history ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Communication & Marketing Tables
ALTER TABLE customer_communications ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE email_campaign_recipients ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE sms_logs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE communication_templates ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Activity & Logging Tables
ALTER TABLE driver_activity_log ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE sanitation_logs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE qr_feedback_submissions ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_interaction_logs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE service_surveys ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE delivery_audit_log ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Document & Compliance Tables
ALTER TABLE document_categories ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE compliance_document_types ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE vehicle_compliance_docs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Reporting & Analytics Tables
ALTER TABLE custom_reports ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE dashboard_configurations ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE filter_presets ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE report_schedules ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Customer Related Tables
ALTER TABLE customer_segments ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_categories ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_portal_tokens ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE customer_stats ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Equipment & Inventory Tables
ALTER TABLE equipment_categories ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE equipment_condition_logs ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE equipment_maintenance_schedules ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE qr_code_scans ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Location & Route Tables
ALTER TABLE service_zones ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE route_templates ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE optimized_routes ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Disposal & Waste Management Tables
ALTER TABLE disposal_manifests ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE disposal_facilities ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Spill & Safety Tables
ALTER TABLE configurable_spill_types ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE spill_kit_types ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE spill_kit_items ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Business Configuration Tables
ALTER TABLE business_hours ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE company_maintenance_settings ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE consumable_notification_settings ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE document_notification_settings ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Availability & Calendar Tables
ALTER TABLE availability_calendar ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE coordinate_equipment_assignments ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Campaign & Automation Tables
ALTER TABLE campaign_analytics ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE automation_requests ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Bundle & Package Tables
ALTER TABLE consumable_bundle_items ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Archived/Deleted Data Tables
ALTER TABLE active_quotes ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Stock Movement Tables
ALTER TABLE daily_vehicle_loads ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Consumable Statistics Tables
ALTER TABLE consumable_daily_usage_90 ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE consumable_velocity_stats ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- ============================================================================
-- PART 2: Create indexes on NEW organization_id columns
-- ============================================================================

-- Training & Certification Indexes
CREATE INDEX IF NOT EXISTS idx_certification_types_org_id ON certification_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_employee_certifications_org_id ON employee_certifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_requirements_org_id ON training_requirements(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_org_id ON training_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_employee_training_records_org_id ON employee_training_records(organization_id);

-- Scheduling Indexes
CREATE INDEX IF NOT EXISTS idx_driver_shifts_org_id ON driver_shifts(organization_id);
CREATE INDEX IF NOT EXISTS idx_shift_templates_org_id ON shift_templates(organization_id);

-- Work Order Indexes
CREATE INDEX IF NOT EXISTS idx_work_order_history_org_id ON work_order_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_work_order_items_org_id ON work_order_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_work_order_parts_org_id ON work_order_parts(organization_id);
CREATE INDEX IF NOT EXISTS idx_work_order_labor_org_id ON work_order_labor(organization_id);

-- Maintenance Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_org_id ON maintenance_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_parts_org_id ON maintenance_parts(organization_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_task_items_org_id ON maintenance_task_items(organization_id);

-- Fuel Management Indexes
CREATE INDEX IF NOT EXISTS idx_fuel_tanks_org_id ON fuel_tanks(organization_id);
CREATE INDEX IF NOT EXISTS idx_fuel_stations_org_id ON fuel_stations(organization_id);
CREATE INDEX IF NOT EXISTS idx_fuel_suppliers_org_id ON fuel_suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_mobile_fuel_services_org_id ON mobile_fuel_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_fuel_price_history_org_id ON fuel_price_history(organization_id);

-- Communication & Marketing Indexes
CREATE INDEX IF NOT EXISTS idx_customer_communications_org_id ON customer_communications(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_org_id ON email_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_org_id ON email_campaign_recipients(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_org_id ON notification_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_org_id ON sms_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_communication_templates_org_id ON communication_templates(organization_id);

-- Activity & Logging Indexes
CREATE INDEX IF NOT EXISTS idx_driver_activity_log_org_id ON driver_activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_sanitation_logs_org_id ON sanitation_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_qr_feedback_submissions_org_id ON qr_feedback_submissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_interaction_logs_org_id ON customer_interaction_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_service_surveys_org_id ON service_surveys(organization_id);
CREATE INDEX IF NOT EXISTS idx_delivery_audit_log_org_id ON delivery_audit_log(organization_id);

-- Document & Compliance Indexes
CREATE INDEX IF NOT EXISTS idx_document_categories_org_id ON document_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_document_types_org_id ON compliance_document_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_compliance_docs_org_id ON vehicle_compliance_docs(organization_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_org_id ON employee_documents(organization_id);

-- Reporting & Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_custom_reports_org_id ON custom_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_configurations_org_id ON dashboard_configurations(organization_id);
CREATE INDEX IF NOT EXISTS idx_filter_presets_org_id ON filter_presets(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_org_id ON report_schedules(organization_id);

-- Customer Indexes
CREATE INDEX IF NOT EXISTS idx_customer_segments_org_id ON customer_segments(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_categories_org_id ON customer_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_portal_tokens_org_id ON customer_portal_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_stats_org_id ON customer_stats(organization_id);

-- Equipment & Inventory Indexes
CREATE INDEX IF NOT EXISTS idx_equipment_categories_org_id ON equipment_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_equipment_condition_logs_org_id ON equipment_condition_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_schedules_org_id ON equipment_maintenance_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_qr_code_scans_org_id ON qr_code_scans(organization_id);

-- Location & Route Indexes
CREATE INDEX IF NOT EXISTS idx_service_zones_org_id ON service_zones(organization_id);
CREATE INDEX IF NOT EXISTS idx_route_templates_org_id ON route_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_optimized_routes_org_id ON optimized_routes(organization_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_org_id ON route_stops(organization_id);

-- Disposal Indexes
CREATE INDEX IF NOT EXISTS idx_disposal_manifests_org_id ON disposal_manifests(organization_id);
CREATE INDEX IF NOT EXISTS idx_disposal_facilities_org_id ON disposal_facilities(organization_id);

-- Spill & Safety Indexes
CREATE INDEX IF NOT EXISTS idx_configurable_spill_types_org_id ON configurable_spill_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_spill_kit_types_org_id ON spill_kit_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_spill_kit_items_org_id ON spill_kit_items(organization_id);

-- Business Configuration Indexes
CREATE INDEX IF NOT EXISTS idx_business_hours_org_id ON business_hours(organization_id);
CREATE INDEX IF NOT EXISTS idx_company_maintenance_settings_org_id ON company_maintenance_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_consumable_notification_settings_org_id ON consumable_notification_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_notification_settings_org_id ON document_notification_settings(organization_id);

-- Availability & Calendar Indexes
CREATE INDEX IF NOT EXISTS idx_availability_calendar_org_id ON availability_calendar(organization_id);
CREATE INDEX IF NOT EXISTS idx_coordinate_equipment_assignments_org_id ON coordinate_equipment_assignments(organization_id);

-- Campaign & Automation Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_org_id ON campaign_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_requests_org_id ON automation_requests(organization_id);

-- Bundle Indexes
CREATE INDEX IF NOT EXISTS idx_consumable_bundle_items_org_id ON consumable_bundle_items(organization_id);

-- Archived Data Indexes
CREATE INDEX IF NOT EXISTS idx_active_quotes_org_id ON active_quotes(organization_id);

-- Stock Movement Indexes
CREATE INDEX IF NOT EXISTS idx_daily_vehicle_loads_org_id ON daily_vehicle_loads(organization_id);

-- Consumable Statistics Indexes
CREATE INDEX IF NOT EXISTS idx_consumable_daily_usage_90_org_id ON consumable_daily_usage_90(organization_id);
CREATE INDEX IF NOT EXISTS idx_consumable_velocity_stats_org_id ON consumable_velocity_stats(organization_id);

-- ============================================================================
-- PART 3: Add indexes to EXISTING organization_id columns that are missing them
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_campaign_drafts_org_id ON campaign_drafts(organization_id);
CREATE INDEX IF NOT EXISTS idx_consumable_bundles_org_id ON consumable_bundles(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_vehicle_assignments_org_id ON daily_vehicle_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_decon_logs_org_id ON decon_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_driver_working_hours_org_id ON driver_working_hours(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_org_id ON invoice_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_consumables_org_id ON job_consumables(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_items_org_id ON job_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_org_id ON maintenance_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_org_id ON notification_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_org_id ON quote_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_spill_incidents_org_id ON spill_incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_org_id ON stock_adjustments(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_org_id ON vehicle_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_damage_logs_org_id ON vehicle_damage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_org_id ON vehicle_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_consumables_org_id ON consumables(organization_id);
CREATE INDEX IF NOT EXISTS idx_consumable_location_stock_org_id ON consumable_location_stock(organization_id);

-- ============================================================================
-- PART 4: Create audit view for monitoring multi-tenant data isolation
-- ============================================================================

CREATE OR REPLACE VIEW v_organization_data_audit AS
SELECT 
  t.table_name,
  (
    SELECT COUNT(*) 
    FROM information_schema.columns c
    WHERE c.table_name = t.table_name 
      AND c.column_name = 'organization_id'
  ) as has_org_id_column,
  (
    SELECT COUNT(*) 
    FROM pg_indexes i
    WHERE i.tablename = t.table_name 
      AND i.indexdef LIKE '%organization_id%'
  ) as has_org_id_index
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT IN ('profiles', 'unified_fuel_consumption', 'unified_product_stock')
ORDER BY t.table_name;

-- ============================================================================
-- VERIFICATION QUERIES - Run these after applying the migration
-- ============================================================================

-- 1. Find tables still missing organization_id column
SELECT table_name 
FROM v_organization_data_audit 
WHERE has_org_id_column = 0
ORDER BY table_name;

-- 2. Find tables with organization_id but missing index
SELECT table_name 
FROM v_organization_data_audit 
WHERE has_org_id_column = 1 AND has_org_id_index = 0
ORDER BY table_name;

-- 3. Count NULL organization_id values in critical tables
SELECT 
  'jobs' as table_name, COUNT(*) as null_count FROM jobs WHERE organization_id IS NULL
UNION ALL
  SELECT 'customers', COUNT(*) FROM customers WHERE organization_id IS NULL
UNION ALL
  SELECT 'invoices', COUNT(*) FROM invoices WHERE organization_id IS NULL
UNION ALL
  SELECT 'quotes', COUNT(*) FROM quotes WHERE organization_id IS NULL
UNION ALL
  SELECT 'products', COUNT(*) FROM products WHERE organization_id IS NULL
UNION ALL
  SELECT 'vehicles', COUNT(*) FROM vehicles WHERE organization_id IS NULL
UNION ALL
  SELECT 'work_orders', COUNT(*) FROM work_orders WHERE organization_id IS NULL;

-- 4. Get summary of all tables with organization_id
SELECT * FROM v_organization_data_audit WHERE has_org_id_column = 1;
