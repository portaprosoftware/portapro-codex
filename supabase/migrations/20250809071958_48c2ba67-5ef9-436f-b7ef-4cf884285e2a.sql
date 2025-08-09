-- 1) Add fields to consumables for velocity calculations
ALTER TABLE public.consumables
  ADD COLUMN IF NOT EXISTS base_unit TEXT NOT NULL DEFAULT 'unit',
  ADD COLUMN IF NOT EXISTS lead_time_days INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS target_days_supply INTEGER NOT NULL DEFAULT 14;

-- 2) Create a stock ledger to record all movements
CREATE TABLE IF NOT EXISTS public.consumable_stock_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumable_id UUID NOT NULL REFERENCES public.consumables(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase','consume','transfer_in','transfer_out','adjust','return')),
  qty INTEGER NOT NULL,
  unit_cost NUMERIC,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  storage_location_id UUID REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  notes TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_csl_consumable_date ON public.consumable_stock_ledger (consumable_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_csl_type ON public.consumable_stock_ledger (type);
CREATE INDEX IF NOT EXISTS idx_csl_storage_location_date ON public.consumable_stock_ledger (storage_location_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_csl_vehicle_date ON public.consumable_stock_ledger (vehicle_id, occurred_at);

-- 3) Daily usage view (last 90 days) for sparklines and sigma
CREATE OR REPLACE VIEW public.consumable_daily_usage_90 AS
WITH dates AS (
  SELECT generate_series((current_date - interval '89 days')::date, current_date::date, interval '1 day')::date AS day
),
consumables AS (
  SELECT id FROM public.consumables WHERE is_active = true
),
grid AS (
  SELECT c.id AS consumable_id, d.day
  FROM consumables c CROSS JOIN dates d
),
usage AS (
  SELECT
    l.consumable_id,
    l.occurred_at::date AS day,
    SUM(
      CASE 
        WHEN l.type = 'consume' THEN ABS(l.qty)
        WHEN l.type = 'adjust' AND l.qty < 0 THEN -l.qty
        ELSE 0
      END
    )::numeric AS consumed_qty
  FROM public.consumable_stock_ledger l
  WHERE l.occurred_at::date >= (current_date - interval '89 days')::date
  GROUP BY l.consumable_id, l.occurred_at::date
)
SELECT 
  g.consumable_id,
  g.day AS usage_date,
  COALESCE(u.consumed_qty, 0)::numeric AS consumed_qty
FROM grid g
LEFT JOIN usage u 
  ON u.consumable_id = g.consumable_id AND u.day = g.day
ORDER BY g.consumable_id, g.day;

-- 4) Velocity stats view (ADU 7/30/90, sigma_30, Days of Supply, ROP, Recommended Order)
CREATE OR REPLACE VIEW public.consumable_velocity_stats AS
WITH usage AS (
  SELECT * FROM public.consumable_daily_usage_90
),
rollups AS (
  SELECT
    consumable_id,
    COALESCE(SUM(CASE WHEN usage_date >= current_date - interval '6 days' THEN consumed_qty END),0)::numeric / 7.0 AS adu_7,
    COALESCE(SUM(CASE WHEN usage_date >= current_date - interval '29 days' THEN consumed_qty END),0)::numeric / 30.0 AS adu_30,
    COALESCE(SUM(consumed_qty),0)::numeric / 90.0 AS adu_90
  FROM usage
  GROUP BY consumable_id
),
sigma AS (
  SELECT 
    u.consumable_id,
    STDDEV_POP(u.consumed_qty) FILTER (WHERE u.usage_date >= current_date - interval '29 days') AS sigma_30
  FROM usage u
  GROUP BY u.consumable_id
)
SELECT 
  c.id AS consumable_id,
  r.adu_7,
  r.adu_30,
  r.adu_90,
  NULL::numeric AS adu_365,
  COALESCE(s.sigma_30, 0) AS sigma_30,
  c.on_hand_qty,
  c.lead_time_days,
  c.target_days_supply,
  CASE 
    WHEN r.adu_30 > 0 THEN (c.on_hand_qty::numeric / r.adu_30)
    ELSE NULL
  END AS days_of_supply,
  CASE 
    WHEN c.lead_time_days > 0 THEN 
      (r.adu_30 * c.lead_time_days) + (1.65 * COALESCE(s.sigma_30,0) * sqrt(c.lead_time_days))
    ELSE NULL
  END AS reorder_point,
  GREATEST(0, CEIL(
    COALESCE(
      (
        (r.adu_30 * c.lead_time_days) + (1.65 * COALESCE(s.sigma_30,0) * sqrt(c.lead_time_days))
      ) 
      + (COALESCE(c.target_days_supply,0) * r.adu_30)
      - c.on_hand_qty::numeric
    , 0)
  )::numeric) AS recommended_order_qty
FROM public.consumables c
LEFT JOIN rollups r ON r.consumable_id = c.id
LEFT JOIN sigma s ON s.consumable_id = c.id;