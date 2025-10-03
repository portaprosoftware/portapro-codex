-- Drop existing functions and views if they exist
DROP FUNCTION IF EXISTS get_vehicle_metrics(uuid);
DROP FUNCTION IF EXISTS get_vehicle_activity(uuid, integer);
DROP VIEW IF EXISTS vehicle_quick_metrics;
DROP VIEW IF EXISTS vehicle_recent_activity;

-- Create view for vehicle quick metrics (simplified)
CREATE VIEW vehicle_quick_metrics AS
SELECT 
  v.id as vehicle_id,
  COUNT(DISTINCT CASE WHEN wo.status IN ('open', 'in_progress') THEN wo.id END) as open_work_orders,
  COUNT(DISTINCT CASE WHEN dr.created_at >= NOW() - INTERVAL '30 days' THEN dr.id END) as dvirs_last_30d,
  0::bigint as incidents_last_30d,
  0::bigint as docs_expiring_30d,
  MAX(dr.created_at) as last_dvir_date,
  (SELECT status FROM dvir_reports WHERE asset_id = v.id AND asset_type = 'vehicle' ORDER BY created_at DESC LIMIT 1) as last_dvir_status
FROM vehicles v
LEFT JOIN work_orders wo ON wo.asset_id = v.id AND wo.asset_type = 'vehicle'
LEFT JOIN dvir_reports dr ON dr.asset_id = v.id AND dr.asset_type = 'vehicle'
GROUP BY v.id;

-- Create view for vehicle recent activity (simplified to avoid missing columns)
CREATE VIEW vehicle_recent_activity AS
SELECT 
  v.id as vehicle_id,
  'work_order'::text as activity_type,
  wo.id as activity_id,
  wo.created_at as activity_date,
  'Work Order Created' as activity_summary
FROM vehicles v
INNER JOIN work_orders wo ON wo.asset_id = v.id AND wo.asset_type = 'vehicle'

UNION ALL

SELECT 
  v.id as vehicle_id,
  'dvir'::text as activity_type,
  dr.id as activity_id,
  dr.created_at as activity_date,
  'DVIR Inspection: ' || dr.status as activity_summary
FROM vehicles v
INNER JOIN dvir_reports dr ON dr.asset_id = v.id AND dr.asset_type = 'vehicle';

-- Create function to get vehicle metrics
CREATE FUNCTION get_vehicle_metrics(p_vehicle_id uuid)
RETURNS TABLE (
  open_work_orders bigint,
  dvirs_last_30d bigint,
  incidents_last_30d bigint,
  docs_expiring_30d bigint,
  last_dvir_date timestamp with time zone,
  last_dvir_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(open_work_orders, 0),
    COALESCE(dvirs_last_30d, 0),
    COALESCE(incidents_last_30d, 0),
    COALESCE(docs_expiring_30d, 0),
    last_dvir_date,
    last_dvir_status
  FROM vehicle_quick_metrics
  WHERE vehicle_id = p_vehicle_id;
$$;

-- Create function to get vehicle activity
CREATE FUNCTION get_vehicle_activity(p_vehicle_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE (
  activity_type text,
  activity_id uuid,
  activity_date timestamp with time zone,
  activity_summary text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    activity_type,
    activity_id,
    activity_date,
    activity_summary
  FROM vehicle_recent_activity
  WHERE vehicle_id = p_vehicle_id
  ORDER BY activity_date DESC
  LIMIT p_limit;
$$;