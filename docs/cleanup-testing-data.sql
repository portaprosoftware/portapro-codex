-- ============================================================================
-- Phase 6D: Data Cleanup Script - DELETE ALL TESTING DATA
-- ============================================================================
-- 
-- ⚠️  WARNING: THIS SCRIPT WILL PERMANENTLY DELETE ALL DATA ⚠️
-- 
-- This script truncates all tables to remove testing data before implementing
-- the multi-tenant organization_id requirements.
--
-- INSTRUCTIONS:
-- 1. BACKUP YOUR DATABASE FIRST (if you want to keep any data)
-- 2. Review this script carefully
-- 3. Copy and paste into Supabase SQL Editor
-- 4. Run manually only when you're absolutely sure
-- 5. This operation is IRREVERSIBLE
--
-- After running this script:
-- - All testing data will be deleted
-- - Table structures remain intact
-- - You can start fresh with organization_id properly set on all new data
-- - No NULL organization_id values will exist
-- ============================================================================

-- Disable triggers temporarily to speed up truncation
SET session_replication_role = 'replica';

-- ============================================================================
-- CORE BUSINESS DATA
-- ============================================================================

TRUNCATE TABLE jobs CASCADE;
TRUNCATE TABLE job_items CASCADE;
TRUNCATE TABLE job_consumables CASCADE;
TRUNCATE TABLE job_assignments CASCADE;

TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE customer_contacts CASCADE;
TRUNCATE TABLE customer_contracts CASCADE;
TRUNCATE TABLE customer_notes CASCADE;
TRUNCATE TABLE customer_service_locations CASCADE;
TRUNCATE TABLE customer_interaction_logs CASCADE;
TRUNCATE TABLE customer_map_pins CASCADE;
TRUNCATE TABLE customer_categories CASCADE;
TRUNCATE TABLE customer_stats CASCADE;
TRUNCATE TABLE customer_segments CASCADE;
TRUNCATE TABLE customer_portal_tokens CASCADE;

TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE invoice_items CASCADE;

TRUNCATE TABLE quotes CASCADE;
TRUNCATE TABLE quote_items CASCADE;
TRUNCATE TABLE active_quotes CASCADE;

-- ============================================================================
-- PRODUCT & INVENTORY
-- ============================================================================

TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE product_items CASCADE;
TRUNCATE TABLE stock_adjustments CASCADE;
TRUNCATE TABLE equipment_assignments CASCADE;
TRUNCATE TABLE equipment_categories CASCADE;
TRUNCATE TABLE equipment_condition_logs CASCADE;
TRUNCATE TABLE equipment_maintenance_schedules CASCADE;
TRUNCATE TABLE coordinate_equipment_assignments CASCADE;

-- ============================================================================
-- CONSUMABLES
-- ============================================================================

TRUNCATE TABLE consumables CASCADE;
TRUNCATE TABLE consumable_location_stock CASCADE;
TRUNCATE TABLE consumable_stock_adjustments CASCADE;
TRUNCATE TABLE consumable_stock_ledger CASCADE;
TRUNCATE TABLE consumable_bundles CASCADE;
TRUNCATE TABLE consumable_bundle_items CASCADE;
TRUNCATE TABLE consumable_daily_usage_90 CASCADE;
TRUNCATE TABLE consumable_velocity_stats CASCADE;

-- ============================================================================
-- FLEET & VEHICLES
-- ============================================================================

TRUNCATE TABLE vehicles CASCADE;
TRUNCATE TABLE vehicle_assignments CASCADE;
TRUNCATE TABLE vehicle_documents CASCADE;
TRUNCATE TABLE vehicle_compliance_docs CASCADE;
TRUNCATE TABLE vehicle_damage_logs CASCADE;
TRUNCATE TABLE daily_vehicle_assignments CASCADE;
TRUNCATE TABLE daily_vehicle_loads CASCADE;

-- ============================================================================
-- FUEL MANAGEMENT
-- ============================================================================

TRUNCATE TABLE fuel_logs CASCADE;
TRUNCATE TABLE fuel_tanks CASCADE;
TRUNCATE TABLE fuel_stations CASCADE;
TRUNCATE TABLE fuel_suppliers CASCADE;
TRUNCATE TABLE fuel_price_history CASCADE;
TRUNCATE TABLE mobile_fuel_services CASCADE;
TRUNCATE TABLE mobile_fuel_service_vehicles CASCADE;
TRUNCATE TABLE mobile_fuel_vendors CASCADE;

-- ============================================================================
-- MAINTENANCE & WORK ORDERS
-- ============================================================================

TRUNCATE TABLE maintenance_records CASCADE;
TRUNCATE TABLE maintenance_tasks CASCADE;
TRUNCATE TABLE maintenance_parts CASCADE;
TRUNCATE TABLE maintenance_task_items CASCADE;

TRUNCATE TABLE work_orders CASCADE;
TRUNCATE TABLE work_order_history CASCADE;
TRUNCATE TABLE work_order_items CASCADE;
TRUNCATE TABLE work_order_parts CASCADE;
TRUNCATE TABLE work_order_labor CASCADE;

-- ============================================================================
-- COMPLIANCE & SAFETY
-- ============================================================================

TRUNCATE TABLE sanitation_logs CASCADE;
TRUNCATE TABLE sanitation_checklists CASCADE;
TRUNCATE TABLE spill_incidents CASCADE;
TRUNCATE TABLE spill_kit_inspections CASCADE;
TRUNCATE TABLE spill_kit_types CASCADE;
TRUNCATE TABLE spill_kit_items CASCADE;
TRUNCATE TABLE decon_logs CASCADE;
TRUNCATE TABLE disposal_manifests CASCADE;
TRUNCATE TABLE disposal_facilities CASCADE;

-- ============================================================================
-- DRIVER & SCHEDULING
-- ============================================================================

TRUNCATE TABLE driver_shifts CASCADE;
TRUNCATE TABLE driver_working_hours CASCADE;
TRUNCATE TABLE driver_activity_log CASCADE;
TRUNCATE TABLE shift_templates CASCADE;
TRUNCATE TABLE availability_calendar CASCADE;

-- ============================================================================
-- TRAINING & CERTIFICATIONS
-- ============================================================================

TRUNCATE TABLE certification_types CASCADE;
TRUNCATE TABLE employee_certifications CASCADE;
TRUNCATE TABLE training_requirements CASCADE;
TRUNCATE TABLE training_sessions CASCADE;
TRUNCATE TABLE employee_training_records CASCADE;
TRUNCATE TABLE employee_documents CASCADE;

-- ============================================================================
-- COMMUNICATIONS & MARKETING
-- ============================================================================

TRUNCATE TABLE customer_communications CASCADE;
TRUNCATE TABLE communication_templates CASCADE;
TRUNCATE TABLE email_campaigns CASCADE;
TRUNCATE TABLE email_campaign_recipients CASCADE;
TRUNCATE TABLE campaign_analytics CASCADE;
TRUNCATE TABLE campaign_drafts CASCADE;
TRUNCATE TABLE sms_logs CASCADE;
TRUNCATE TABLE notification_logs CASCADE;
TRUNCATE TABLE notification_templates CASCADE;

-- ============================================================================
-- QR & FEEDBACK
-- ============================================================================

TRUNCATE TABLE qr_code_scans CASCADE;
TRUNCATE TABLE qr_feedback_submissions CASCADE;
TRUNCATE TABLE service_surveys CASCADE;

-- ============================================================================
-- ROUTING & LOGISTICS
-- ============================================================================

TRUNCATE TABLE service_zones CASCADE;
TRUNCATE TABLE route_templates CASCADE;
TRUNCATE TABLE optimized_routes CASCADE;
TRUNCATE TABLE route_stops CASCADE;

-- ============================================================================
-- REPORTS & ANALYTICS
-- ============================================================================

TRUNCATE TABLE custom_reports CASCADE;
TRUNCATE TABLE dashboard_configurations CASCADE;
TRUNCATE TABLE filter_presets CASCADE;
TRUNCATE TABLE report_schedules CASCADE;

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

TRUNCATE TABLE delivery_audit_log CASCADE;

-- ============================================================================
-- AUTOMATION
-- ============================================================================

TRUNCATE TABLE automation_requests CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this after truncation to verify all tables are empty

SELECT 
  schemaname,
  tablename,
  (
    SELECT COUNT(*) 
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = t.tablename 
      AND n.nspname = t.schemaname
      AND c.relkind = 'r'
  ) as row_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename NOT IN ('profiles', 'user_roles', 'user_invitations')
ORDER BY tablename;

-- ============================================================================
-- POST-CLEANUP NOTES
-- ============================================================================
--
-- After running this cleanup:
--
-- 1. All testing data is deleted
-- 2. Table structures remain intact with organization_id columns
-- 3. Apply the migration from docs/add_organization_id_migration.sql if not done yet
-- 4. Start creating new data with proper organization_id values
-- 5. All new records will have organization_id set correctly
-- 6. No NULL organization_id values should exist going forward
--
-- ============================================================================
