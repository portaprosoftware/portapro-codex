
-- Phase 5: Advanced Analytics - Create analytics tables
CREATE TABLE public.fleet_utilization_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  vehicle_id UUID NOT NULL,
  total_capacity INTEGER NOT NULL DEFAULT 0,
  utilized_capacity INTEGER NOT NULL DEFAULT 0,
  utilization_percentage NUMERIC NOT NULL DEFAULT 0,
  efficiency_score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, vehicle_id)
);

-- Phase 6: Vehicle Capacity Configuration - Create configuration tables
CREATE TABLE public.vehicle_capacity_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  configuration_name TEXT NOT NULL,
  total_weight_capacity NUMERIC,
  total_volume_capacity NUMERIC,
  compartment_config JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vehicle_id, configuration_name)
);

-- Phase 7: Mobile Integration - Create mobile sync tables
CREATE TABLE public.load_management_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  sync_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sync_type TEXT NOT NULL, -- 'check_in', 'check_out', 'load_update'
  sync_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  device_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 8: Reporting and Compliance - Create compliance tracking
CREATE TABLE public.load_compliance_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE NOT NULL,
  vehicle_id UUID NOT NULL,
  weight_violations INTEGER DEFAULT 0,
  capacity_violations INTEGER DEFAULT 0,
  efficiency_below_threshold INTEGER DEFAULT 0,
  compliance_score NUMERIC DEFAULT 100,
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.fleet_utilization_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_capacity_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_management_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_compliance_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public access to fleet utilization analytics" 
ON public.fleet_utilization_analytics 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Public access to vehicle capacity configurations" 
ON public.vehicle_capacity_configurations 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Public access to load management sync log" 
ON public.load_management_sync_log 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Public access to load compliance reports" 
ON public.load_compliance_reports 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_fleet_analytics_date_vehicle ON public.fleet_utilization_analytics(date, vehicle_id);
CREATE INDEX idx_capacity_config_vehicle ON public.vehicle_capacity_configurations(vehicle_id);
CREATE INDEX idx_sync_log_vehicle_timestamp ON public.load_management_sync_log(vehicle_id, sync_timestamp);
CREATE INDEX idx_compliance_reports_date ON public.load_compliance_reports(report_date);

-- Create triggers for updated_at
CREATE TRIGGER update_fleet_analytics_updated_at
BEFORE UPDATE ON public.fleet_utilization_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_capacity_config_updated_at
BEFORE UPDATE ON public.vehicle_capacity_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_reports_updated_at
BEFORE UPDATE ON public.load_compliance_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Phase 5: Advanced Analytics Functions
CREATE OR REPLACE FUNCTION public.calculate_fleet_efficiency_trends(
  start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  daily_trends jsonb[];
  vehicle_rankings jsonb[];
BEGIN
  -- Calculate daily efficiency trends
  SELECT array_agg(
    jsonb_build_object(
      'date', date,
      'avg_utilization', avg_utilization,
      'total_vehicles', vehicle_count,
      'efficiency_score', efficiency_score
    )
  ) INTO daily_trends
  FROM (
    SELECT 
      dvl.load_date as date,
      AVG(CASE WHEN vlc.max_capacity > 0 THEN (dvl.assigned_quantity::numeric / vlc.max_capacity) * 100 ELSE 0 END) as avg_utilization,
      COUNT(DISTINCT dvl.vehicle_id) as vehicle_count,
      AVG(CASE WHEN vlc.max_capacity > 0 THEN LEAST(100, (dvl.assigned_quantity::numeric / vlc.max_capacity) * 100) ELSE 0 END) as efficiency_score
    FROM public.daily_vehicle_loads dvl
    JOIN public.vehicle_load_capacities vlc ON vlc.vehicle_id = dvl.vehicle_id AND vlc.product_id = dvl.product_id
    WHERE dvl.load_date BETWEEN start_date AND end_date
    GROUP BY dvl.load_date
    ORDER BY dvl.load_date
  ) trends;

  -- Calculate vehicle efficiency rankings
  SELECT array_agg(
    jsonb_build_object(
      'vehicle_id', vehicle_id,
      'license_plate', license_plate,
      'avg_efficiency', avg_efficiency,
      'total_loads', total_loads,
      'rank', rank
    )
  ) INTO vehicle_rankings
  FROM (
    SELECT 
      v.id as vehicle_id,
      v.license_plate,
      AVG(CASE WHEN vlc.max_capacity > 0 THEN LEAST(100, (dvl.assigned_quantity::numeric / vlc.max_capacity) * 100) ELSE 0 END) as avg_efficiency,
      COUNT(*) as total_loads,
      ROW_NUMBER() OVER (ORDER BY AVG(CASE WHEN vlc.max_capacity > 0 THEN LEAST(100, (dvl.assigned_quantity::numeric / vlc.max_capacity) * 100) ELSE 0 END) DESC) as rank
    FROM public.vehicles v
    JOIN public.daily_vehicle_loads dvl ON dvl.vehicle_id = v.id
    JOIN public.vehicle_load_capacities vlc ON vlc.vehicle_id = dvl.vehicle_id AND vlc.product_id = dvl.product_id
    WHERE dvl.load_date BETWEEN start_date AND end_date
    GROUP BY v.id, v.license_plate
    HAVING COUNT(*) >= 5 -- Only include vehicles with at least 5 load records
    ORDER BY avg_efficiency DESC
    LIMIT 10
  ) rankings;

  result := jsonb_build_object(
    'period', jsonb_build_object('start_date', start_date, 'end_date', end_date),
    'daily_trends', COALESCE(daily_trends, '[]'::jsonb[]),
    'vehicle_rankings', COALESCE(vehicle_rankings, '[]'::jsonb[]),
    'generated_at', now()
  );

  RETURN result;
END;
$$;

-- Phase 8: Compliance monitoring function
CREATE OR REPLACE FUNCTION public.generate_daily_compliance_report(target_date date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  violations_summary jsonb;
  vehicle_violations jsonb[];
BEGIN
  -- Calculate compliance violations for the target date
  SELECT array_agg(
    jsonb_build_object(
      'vehicle_id', vehicle_id,
      'license_plate', license_plate,
      'weight_violations', weight_violations,
      'capacity_violations', capacity_violations,
      'compliance_score', compliance_score
    )
  ) INTO vehicle_violations
  FROM (
    SELECT 
      v.id as vehicle_id,
      v.license_plate,
      COUNT(*) FILTER (WHERE (dvl.assigned_quantity::numeric / NULLIF(vlc.max_capacity, 0)) > 1.0) as capacity_violations,
      0 as weight_violations, -- Placeholder for weight violations
      CASE 
        WHEN COUNT(*) = 0 THEN 100
        ELSE GREATEST(0, 100 - (COUNT(*) FILTER (WHERE (dvl.assigned_quantity::numeric / NULLIF(vlc.max_capacity, 0)) > 1.0) * 25))
      END as compliance_score
    FROM public.vehicles v
    LEFT JOIN public.daily_vehicle_loads dvl ON dvl.vehicle_id = v.id AND dvl.load_date = target_date
    LEFT JOIN public.vehicle_load_capacities vlc ON vlc.vehicle_id = dvl.vehicle_id AND vlc.product_id = dvl.product_id
    WHERE v.status = 'active'
    GROUP BY v.id, v.license_plate
  ) violations;

  -- Calculate summary statistics
  violations_summary := jsonb_build_object(
    'total_vehicles', (SELECT COUNT(*) FROM public.vehicles WHERE status = 'active'),
    'vehicles_in_violation', (SELECT COUNT(*) FROM jsonb_array_elements(COALESCE(vehicle_violations, '[]'::jsonb[])) WHERE (value->>'capacity_violations')::int > 0),
    'avg_compliance_score', (SELECT AVG((value->>'compliance_score')::numeric) FROM jsonb_array_elements(COALESCE(vehicle_violations, '[]'::jsonb[]))),
    'total_capacity_violations', (SELECT SUM((value->>'capacity_violations')::int) FROM jsonb_array_elements(COALESCE(vehicle_violations, '[]'::jsonb[])))
  );

  result := jsonb_build_object(
    'report_date', target_date,
    'summary', violations_summary,
    'vehicle_violations', COALESCE(vehicle_violations, '[]'::jsonb[]),
    'generated_at', now()
  );

  -- Store the report
  INSERT INTO public.load_compliance_reports (
    report_date,
    vehicle_id,
    capacity_violations,
    compliance_score,
    report_data
  )
  SELECT 
    target_date,
    (value->>'vehicle_id')::uuid,
    (value->>'capacity_violations')::int,
    (value->>'compliance_score')::numeric,
    value
  FROM jsonb_array_elements(COALESCE(vehicle_violations, '[]'::jsonb[]))
  ON CONFLICT (report_date, vehicle_id) DO UPDATE SET
    capacity_violations = EXCLUDED.capacity_violations,
    compliance_score = EXCLUDED.compliance_score,
    report_data = EXCLUDED.report_data;

  RETURN result;
END;
$$;
