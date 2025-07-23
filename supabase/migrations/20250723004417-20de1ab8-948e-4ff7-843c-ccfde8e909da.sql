-- Create vehicle load capacities table
CREATE TABLE public.vehicle_load_capacities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  product_id UUID NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vehicle_id, product_id)
);

-- Create daily vehicle loads table
CREATE TABLE public.daily_vehicle_loads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  product_id UUID NOT NULL,
  load_date DATE NOT NULL,
  assigned_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vehicle_id, product_id, load_date)
);

-- Enable RLS
ALTER TABLE public.vehicle_load_capacities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_vehicle_loads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public access to vehicle load capacities" 
ON public.vehicle_load_capacities 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Public access to daily vehicle loads" 
ON public.daily_vehicle_loads 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_vehicle_load_capacities_vehicle_id ON public.vehicle_load_capacities(vehicle_id);
CREATE INDEX idx_daily_vehicle_loads_vehicle_date ON public.daily_vehicle_loads(vehicle_id, load_date);
CREATE INDEX idx_daily_vehicle_loads_date_product ON public.daily_vehicle_loads(load_date, product_id);

-- Create trigger for updated_at
CREATE TRIGGER update_vehicle_load_capacities_updated_at
BEFORE UPDATE ON public.vehicle_load_capacities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_vehicle_loads_updated_at
BEFORE UPDATE ON public.daily_vehicle_loads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate daily vehicle loads from equipment assignments
CREATE OR REPLACE FUNCTION public.calculate_daily_vehicle_loads(target_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Clear existing calculations for the target date
  DELETE FROM public.daily_vehicle_loads WHERE load_date = target_date;
  
  -- Calculate loads from equipment assignments through jobs
  INSERT INTO public.daily_vehicle_loads (vehicle_id, product_id, load_date, assigned_quantity)
  SELECT 
    j.vehicle_id,
    COALESCE(ea.product_id, pi.product_id) as product_id,
    target_date as load_date,
    SUM(COALESCE(ea.quantity, 1)) as assigned_quantity
  FROM public.jobs j
  INNER JOIN public.equipment_assignments ea ON ea.job_id = j.id
  LEFT JOIN public.product_items pi ON pi.id = ea.product_item_id
  WHERE j.scheduled_date = target_date
    AND j.vehicle_id IS NOT NULL
    AND ea.status IN ('assigned', 'delivered', 'in_service')
    AND (ea.product_id IS NOT NULL OR pi.product_id IS NOT NULL)
  GROUP BY j.vehicle_id, COALESCE(ea.product_id, pi.product_id)
  ON CONFLICT (vehicle_id, product_id, load_date) 
  DO UPDATE SET 
    assigned_quantity = EXCLUDED.assigned_quantity,
    updated_at = now();
END;
$function$;