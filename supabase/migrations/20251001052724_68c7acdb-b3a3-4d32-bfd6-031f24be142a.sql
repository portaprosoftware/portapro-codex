-- Add weather_details column to store auto-fetched weather information
ALTER TABLE public.vehicle_spill_kit_checks 
ADD COLUMN weather_details text;