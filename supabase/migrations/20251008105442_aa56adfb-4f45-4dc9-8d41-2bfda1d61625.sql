-- Tier 1: Core Service Details for Mobile Fuel Services

-- Add new columns to mobile_fuel_services table
ALTER TABLE public.mobile_fuel_services
ADD COLUMN service_start_time TIME,
ADD COLUMN service_end_time TIME,
ADD COLUMN vendor_driver_name TEXT,
ADD COLUMN vendor_truck_number TEXT,
ADD COLUMN fuel_grade TEXT CHECK (fuel_grade IN ('diesel_2', 'dyed_diesel', 'gasoline_87', 'gasoline_91', 'def', 'biodiesel')),
ADD COLUMN price_per_gallon NUMERIC(10,3),
ADD COLUMN payment_method TEXT CHECK (payment_method IN ('ach', 'check', 'net_30', 'cod', 'credit_card', 'cash'));

-- Add computed column check: total_cost should equal price_per_gallon * total_gallons (with tolerance for rounding)
-- This is a soft check via trigger rather than constraint to allow manual adjustments

COMMENT ON COLUMN public.mobile_fuel_services.service_start_time IS 'Delivery window start time';
COMMENT ON COLUMN public.mobile_fuel_services.service_end_time IS 'Delivery window end time';
COMMENT ON COLUMN public.mobile_fuel_services.vendor_driver_name IS 'Name of vendor driver/technician who performed fueling';
COMMENT ON COLUMN public.mobile_fuel_services.vendor_truck_number IS 'Vendor tanker truck identifier/unit number';
COMMENT ON COLUMN public.mobile_fuel_services.fuel_grade IS 'Specific fuel grade delivered';
COMMENT ON COLUMN public.mobile_fuel_services.price_per_gallon IS 'Price per gallon charged';
COMMENT ON COLUMN public.mobile_fuel_services.payment_method IS 'Payment method or terms for this service';