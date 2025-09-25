-- Add daily_rate column to maintenance_vendors table
ALTER TABLE public.maintenance_vendors 
ADD COLUMN daily_rate numeric;