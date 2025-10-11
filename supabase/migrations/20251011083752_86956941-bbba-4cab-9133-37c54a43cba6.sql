-- Drop existing view
DROP VIEW IF EXISTS vehicle_quick_metrics;

-- Recreate view with real data for all metrics
CREATE VIEW vehicle_quick_metrics AS
SELECT 
  v.id as vehicle_id,
  v.license_plate,
  COUNT(DISTINCT CASE WHEN wo.status IN ('open', 'in_progress') AND wo.asset_type = 'vehicle' THEN wo.id END) as open_work_orders,
  COUNT(DISTINCT CASE WHEN dr.created_at >= NOW() - INTERVAL '30 days' THEN dr.id END) as dvirs_last_30d,
  COUNT(DISTINCT CASE WHEN si.occurred_at >= NOW() - INTERVAL '30 days' THEN si.id END) as incidents_last_30d,
  COUNT(DISTINCT CASE WHEN dc.created_at >= NOW() - INTERVAL '30 days' THEN dc.id END) as decon_last_30d,
  COUNT(DISTINCT CASE 
    WHEN vd.expiry_date IS NOT NULL 
    AND vd.expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days' 
    THEN vd.id 
  END) as docs_expiring_30d,
  MAX(dr.created_at) as last_dvir_date,
  (SELECT status FROM dvir_reports WHERE asset_id = v.id AND asset_type = 'vehicle' ORDER BY created_at DESC LIMIT 1) as last_dvir_status
FROM vehicles v
LEFT JOIN work_orders wo ON wo.asset_id = v.id AND wo.asset_type = 'vehicle'
LEFT JOIN dvir_reports dr ON dr.asset_id = v.id AND dr.asset_type = 'vehicle'
LEFT JOIN spill_incidents si ON si.vehicle_id = v.id
LEFT JOIN decon_logs dc ON dc.vehicle_id = v.id
LEFT JOIN vehicle_documents vd ON vd.vehicle_id = v.id
GROUP BY v.id, v.license_plate;