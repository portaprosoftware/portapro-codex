-- Fix database schema for driver working hours

-- Ensure the foreign key relationship exists properly
ALTER TABLE public.driver_working_hours 
DROP CONSTRAINT IF EXISTS driver_working_hours_driver_id_fkey;

ALTER TABLE public.driver_working_hours 
ADD CONSTRAINT driver_working_hours_driver_id_fkey 
FOREIGN KEY (driver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_driver_working_hours_driver_id 
ON public.driver_working_hours(driver_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_role 
ON public.user_roles(role);

-- Add a function to get drivers with their working hours efficiently
CREATE OR REPLACE FUNCTION public.get_drivers_with_hours()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  working_hours jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'day_of_week', dwh.day_of_week,
          'is_active', dwh.is_active,
          'start_time', dwh.start_time,
          'end_time', dwh.end_time
        ) ORDER BY dwh.day_of_week
      ) FILTER (WHERE dwh.driver_id IS NOT NULL),
      '[]'::jsonb
    ) as working_hours
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.driver_working_hours dwh ON dwh.driver_id = p.id
  WHERE ur.role = 'driver'
  GROUP BY p.id, p.first_name, p.last_name
  ORDER BY p.first_name, p.last_name;
END;
$$;