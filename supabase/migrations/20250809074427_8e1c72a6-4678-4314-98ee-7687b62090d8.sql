-- 1) Recipes table for schedule forecasting and route needs
CREATE TABLE IF NOT EXISTS public.job_type_consumable_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  consumable_id uuid NOT NULL REFERENCES public.consumables(id) ON DELETE CASCADE,
  quantity_per_job numeric NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_type_consumable_recipes_job_type ON public.job_type_consumable_recipes(job_type);
CREATE INDEX IF NOT EXISTS idx_job_type_consumable_recipes_consumable ON public.job_type_consumable_recipes(consumable_id);

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS update_job_type_consumable_recipes_updated_at ON public.job_type_consumable_recipes;
CREATE TRIGGER update_job_type_consumable_recipes_updated_at
BEFORE UPDATE ON public.job_type_consumable_recipes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_timestamp();

-- 2) Truck stock balances per vehicle from the ledger
CREATE OR REPLACE VIEW public.vehicle_consumable_balances AS
WITH entries AS (
  SELECT
    vehicle_id,
    consumable_id,
    CASE 
      WHEN type IN ('receive','adjust_in','transfer_in','load','return') THEN qty
      WHEN type IN ('consume','adjust_out','transfer_out','unload','issue') THEN -qty
      ELSE 0
    END AS delta
  FROM public.consumable_stock_ledger
  WHERE vehicle_id IS NOT NULL
)
SELECT 
  vehicle_id,
  consumable_id,
  COALESCE(SUM(delta),0)::int AS balance_qty
FROM entries
GROUP BY vehicle_id, consumable_id;

-- 3) Materials cost per job using moving-average unit cost
CREATE OR REPLACE VIEW public.job_materials_cost AS
SELECT 
  jc.job_id,
  SUM(jc.quantity * COALESCE(ac.moving_avg_cost, c.unit_cost, 0)) AS total_material_cost
FROM public.job_consumables jc
JOIN public.consumables c ON c.id = jc.consumable_id
LEFT JOIN (
  SELECT consumable_id,
         CASE WHEN SUM(qty) FILTER (WHERE unit_cost IS NOT NULL) <> 0
              THEN SUM(qty * COALESCE(unit_cost, 0)) / NULLIF(SUM(qty), 0)
              ELSE NULL
         END AS moving_avg_cost
  FROM public.consumable_stock_ledger
  WHERE type IN ('receive','adjust_in','transfer_in')
  GROUP BY consumable_id
) ac ON ac.consumable_id = jc.consumable_id
GROUP BY jc.job_id;

-- 4) Forecast from schedule for a date range
CREATE OR REPLACE FUNCTION public.get_consumable_forecast(start_date date, end_date date)
RETURNS TABLE (
  consumable_id uuid,
  consumable_name text,
  required_qty numeric,
  on_hand integer,
  deficit integer,
  suggested_order_qty integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH job_counts AS (
    SELECT j.job_type, COUNT(*) AS job_count
    FROM public.jobs j
    WHERE j.scheduled_date BETWEEN start_date AND end_date
      AND (j.status IS NULL OR j.status NOT IN ('completed','cancelled'))
    GROUP BY j.job_type
  ),
  requirements AS (
    SELECT r.consumable_id,
           SUM(r.quantity_per_job * jc.job_count)::numeric AS required_qty
    FROM public.job_type_consumable_recipes r
    JOIN job_counts jc ON jc.job_type = r.job_type
    GROUP BY r.consumable_id
  )
  SELECT 
    c.id AS consumable_id,
    c.name AS consumable_name,
    COALESCE(req.required_qty, 0) AS required_qty,
    c.on_hand_qty AS on_hand,
    GREATEST(COALESCE(req.required_qty,0)::int - c.on_hand_qty, 0) AS deficit,
    GREATEST(COALESCE(req.required_qty,0)::int - c.on_hand_qty, 0) AS suggested_order_qty
  FROM public.consumables c
  LEFT JOIN requirements req ON req.consumable_id = c.id
  WHERE COALESCE(req.required_qty, 0) > 0
  ORDER BY deficit DESC, required_qty DESC;
END;
$$;

-- 5) Route vs. truck stock check for a vehicle and date
CREATE OR REPLACE FUNCTION public.get_route_stock_status(vehicle_uuid uuid, service_date date)
RETURNS TABLE (
  consumable_id uuid,
  consumable_name text,
  needed_qty integer,
  vehicle_balance integer,
  deficit integer,
  ok boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH jobs_by_vehicle AS (
    SELECT j.id, j.job_type
    FROM public.jobs j
    WHERE j.scheduled_date = service_date 
      AND (j.vehicle_id = vehicle_uuid OR EXISTS (
        SELECT 1 FROM public.vehicle_assignments va 
        WHERE va.job_id = j.id 
          AND va.vehicle_id = vehicle_uuid
          AND va.assignment_date::date = service_date
          AND (va.status IS NULL OR va.status IN ('assigned','active'))
      ))
      AND (j.status IS NULL OR j.status NOT IN ('completed','cancelled'))
  ),
  requirements_by_consumable AS (
    SELECT r.consumable_id, SUM(r.quantity_per_job)::int AS needed_qty
    FROM jobs_by_vehicle jb
    JOIN public.job_type_consumable_recipes r ON r.job_type = jb.job_type
    GROUP BY r.consumable_id
  ),
  balances AS (
    SELECT consumable_id, balance_qty
    FROM public.vehicle_consumable_balances
    WHERE vehicle_id = vehicle_uuid
  )
  SELECT 
    req.consumable_id,
    c.name,
    req.needed_qty,
    COALESCE(bal.balance_qty, 0) AS vehicle_balance,
    GREATEST(req.needed_qty - COALESCE(bal.balance_qty, 0), 0) AS deficit,
    (COALESCE(bal.balance_qty, 0) >= req.needed_qty) AS ok
  FROM requirements_by_consumable req
  JOIN public.consumables c ON c.id = req.consumable_id
  LEFT JOIN balances bal ON bal.consumable_id = req.consumable_id
  ORDER BY ok ASC, deficit DESC, c.name;
END;
$$;