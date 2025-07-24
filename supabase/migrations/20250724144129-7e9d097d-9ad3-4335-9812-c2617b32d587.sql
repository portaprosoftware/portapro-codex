-- Fix the search_path security issue for the get_drivers_with_hours function
CREATE OR REPLACE FUNCTION public.get_drivers_with_hours()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  working_hours jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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