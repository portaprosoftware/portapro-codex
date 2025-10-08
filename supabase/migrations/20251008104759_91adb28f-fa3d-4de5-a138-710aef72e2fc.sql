-- Tier 3: Advanced Analytics fields for mobile_fuel_vendors

-- Add Tier 3 columns
ALTER TABLE public.mobile_fuel_vendors
ADD COLUMN IF NOT EXISTS service_radius_mi INTEGER,
ADD COLUMN IF NOT EXISTS average_response_time_hrs NUMERIC,
ADD COLUMN IF NOT EXISTS fuel_surcharge_policy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fuel_surcharge_notes TEXT;

-- Add helpful comments for documentation
COMMENT ON COLUMN public.mobile_fuel_vendors.service_radius_mi IS 'Service coverage radius in miles for map-based filtering';
COMMENT ON COLUMN public.mobile_fuel_vendors.average_response_time_hrs IS 'Average response time in hours - initially manual, later auto-calculated from service logs';
COMMENT ON COLUMN public.mobile_fuel_vendors.fuel_surcharge_policy IS 'Whether vendor has fuel surcharge policy in effect';
COMMENT ON COLUMN public.mobile_fuel_vendors.fuel_surcharge_notes IS 'Details about fuel surcharge policy and conditions';

-- Create view for vendor analytics dashboard
CREATE OR REPLACE VIEW public.vendor_performance_metrics AS
SELECT 
  v.id,
  v.vendor_id,
  v.vendor_name,
  v.service_radius_mi,
  v.average_response_time_hrs,
  v.fuel_surcharge_policy,
  v.safety_status,
  v.payment_terms,
  v.pricing_model,
  COUNT(s.id) as total_services,
  COALESCE(SUM(s.total_gallons), 0) as total_gallons_delivered,
  COALESCE(AVG(s.cost_per_gallon), 0) as avg_cost_per_gallon,
  MAX(s.service_date) as last_service_date,
  CASE 
    WHEN v.insurance_expiration_date IS NOT NULL 
      AND v.insurance_expiration_date <= CURRENT_DATE + INTERVAL '30 days'
    THEN true
    ELSE false
  END as compliance_warning
FROM public.mobile_fuel_vendors v
LEFT JOIN public.mobile_fuel_services s ON s.vendor_id = v.id
WHERE v.is_active = true
GROUP BY v.id, v.vendor_id, v.vendor_name, v.service_radius_mi, 
         v.average_response_time_hrs, v.fuel_surcharge_policy, 
         v.safety_status, v.payment_terms, v.pricing_model, v.insurance_expiration_date;

-- Grant access to the view
GRANT SELECT ON public.vendor_performance_metrics TO authenticated;