-- Drop the existing generated column and recreate it as a regular column with a trigger
-- First, drop the generated column
ALTER TABLE public.fuel_tanks DROP COLUMN IF EXISTS requires_spcc;

-- Add it back as a regular boolean column
ALTER TABLE public.fuel_tanks ADD COLUMN requires_spcc BOOLEAN DEFAULT false;

-- Create function to auto-set requires_spcc based on capacity and settings
CREATE OR REPLACE FUNCTION public.auto_set_tank_requires_spcc()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  spcc_threshold INTEGER;
BEGIN
  -- Get the SPCC threshold from settings
  SELECT spcc_tank_threshold_gallons INTO spcc_threshold
  FROM public.fuel_management_settings
  LIMIT 1;
  
  -- Default to 1320 if no settings found
  IF spcc_threshold IS NULL THEN
    spcc_threshold := 1320;
  END IF;
  
  -- Set requires_spcc based on capacity
  NEW.requires_spcc := (NEW.capacity_gallons >= spcc_threshold);
  
  RETURN NEW;
END;
$$;

-- Create trigger on fuel_tanks for INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_auto_set_tank_requires_spcc ON public.fuel_tanks;
CREATE TRIGGER trigger_auto_set_tank_requires_spcc
  BEFORE INSERT OR UPDATE OF capacity_gallons
  ON public.fuel_tanks
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_tank_requires_spcc();

-- Update existing tanks to set requires_spcc correctly
UPDATE public.fuel_tanks
SET capacity_gallons = capacity_gallons
WHERE true;