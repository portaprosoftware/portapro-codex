-- Create RPC functions for vehicle profile data fetching

-- Function to get vehicle metrics
CREATE OR REPLACE FUNCTION get_vehicle_metrics(p_vehicle_id UUID)
RETURNS TABLE (
  vehicle_id UUID,
  license_plate TEXT,
  open_work_orders BIGINT,
  dvirs_last_30d BIGINT,
  incidents_last_30d BIGINT,
  decon_last_30d BIGINT,
  docs_expiring_30d BIGINT,
  last_dvir_date TIMESTAMP WITH TIME ZONE,
  last_dvir_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM vehicle_quick_metrics
  WHERE vehicle_quick_metrics.vehicle_id = p_vehicle_id;
END;
$$;

-- Function to get vehicle recent activity
CREATE OR REPLACE FUNCTION get_vehicle_activity(p_vehicle_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE (
  vehicle_id UUID,
  activity_type TEXT,
  activity_id UUID,
  activity_date TIMESTAMP WITH TIME ZONE,
  activity_summary TEXT,
  rn BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vra.vehicle_id::UUID,
    vra.activity_type,
    vra.activity_id::UUID,
    vra.activity_date,
    vra.activity_summary,
    vra.rn
  FROM vehicle_recent_activity vra
  WHERE vra.vehicle_id::TEXT = p_vehicle_id::TEXT
    AND vra.rn <= p_limit
  ORDER BY vra.activity_date DESC;
END;
$$;