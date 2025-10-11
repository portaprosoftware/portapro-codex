-- Drop existing function first
DROP FUNCTION IF EXISTS get_vehicle_activity(uuid, integer);

-- Drop and recreate vehicle_recent_activity view with all activity types
DROP VIEW IF EXISTS vehicle_recent_activity CASCADE;

CREATE VIEW vehicle_recent_activity AS
-- Work Orders
SELECT 
  wo.asset_id as vehicle_id,
  'work_order' as activity_type,
  wo.id::text as activity_id,
  wo.created_at as activity_date,
  'Work Order: ' || wo.description as activity_summary,
  ROW_NUMBER() OVER (PARTITION BY wo.asset_id ORDER BY wo.created_at DESC) as rn
FROM work_orders wo
WHERE wo.asset_type = 'vehicle'

UNION ALL

-- DVIR Reports
SELECT 
  dr.asset_id as vehicle_id,
  'dvir' as activity_type,
  dr.id::text as activity_id,
  dr.submitted_at as activity_date,
  'DVIR: ' || dr.status || ' - ' || COALESCE(dr.defects_count::text, '0') || ' defects' as activity_summary,
  ROW_NUMBER() OVER (PARTITION BY dr.asset_id ORDER BY dr.submitted_at DESC) as rn
FROM dvir_reports dr
WHERE dr.asset_type = 'vehicle'

UNION ALL

-- Maintenance Records
SELECT 
  mr.vehicle_id,
  'maintenance' as activity_type,
  mr.id::text as activity_id,
  COALESCE(mr.completed_date, mr.scheduled_date, mr.created_at) as activity_date,
  'Maintenance: ' || mr.maintenance_type || ' - ' || COALESCE(mr.description, mr.status) as activity_summary,
  ROW_NUMBER() OVER (PARTITION BY mr.vehicle_id ORDER BY COALESCE(mr.completed_date, mr.scheduled_date, mr.created_at) DESC) as rn
FROM maintenance_records mr

UNION ALL

-- Fuel Consumption
SELECT 
  fc.vehicle_id,
  'fuel' as activity_type,
  fc.reference_id::text as activity_id,
  fc.fuel_date::timestamp with time zone as activity_date,
  'Fuel: ' || fc.gallons || ' gal - $' || fc.cost as activity_summary,
  ROW_NUMBER() OVER (PARTITION BY fc.vehicle_id ORDER BY fc.fuel_date DESC) as rn
FROM unified_fuel_consumption fc

UNION ALL

-- Spill Incidents
SELECT 
  si.vehicle_id,
  'incident' as activity_type,
  si.id::text as activity_id,
  si.occurred_at as activity_date,
  'Incident: ' || COALESCE(si.material_type, 'Unknown') || ' - ' || si.status as activity_summary,
  ROW_NUMBER() OVER (PARTITION BY si.vehicle_id ORDER BY si.occurred_at DESC) as rn
FROM spill_incidents si;

-- Recreate the get_vehicle_activity function
CREATE OR REPLACE FUNCTION get_vehicle_activity(p_vehicle_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(
  vehicle_id uuid,
  activity_type text,
  activity_id text,
  activity_date timestamp with time zone,
  activity_summary text,
  rn bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    vra.vehicle_id::uuid,
    vra.activity_type,
    vra.activity_id,
    vra.activity_date,
    vra.activity_summary,
    vra.rn
  FROM vehicle_recent_activity vra
  WHERE vra.vehicle_id = p_vehicle_id
  ORDER BY vra.activity_date DESC
  LIMIT p_limit;
$$;