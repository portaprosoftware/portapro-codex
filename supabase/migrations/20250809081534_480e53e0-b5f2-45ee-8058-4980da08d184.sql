-- Enums
DO $$ BEGIN
  CREATE TYPE public.dvir_asset_type AS ENUM ('vehicle', 'trailer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.dvir_report_type AS ENUM ('pre_trip', 'post_trip');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.dvir_status AS ENUM ('draft', 'submitted', 'defects_found', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.defect_severity AS ENUM ('minor', 'major');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.defect_status AS ENUM ('open', 'in_work', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.work_order_source AS ENUM ('dvir_defect', 'pm', 'breakdown', 'recall', 'campaign', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.work_order_priority AS ENUM ('low', 'normal', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.work_order_status AS ENUM ('open', 'awaiting_parts', 'in_progress', 'vendor', 'on_hold', 'ready_for_verification', 'completed', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.pm_target_type AS ENUM ('vehicle', 'trailer', 'group');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Vehicles safety columns (non-breaking)
ALTER TABLE IF EXISTS public.vehicles
  ADD COLUMN IF NOT EXISTS out_of_service boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pending_driver_verification boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS meter_miles integer,
  ADD COLUMN IF NOT EXISTS meter_hours integer;

-- DVIR reports
CREATE TABLE IF NOT EXISTS public.dvir_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  asset_type public.dvir_asset_type NOT NULL,
  asset_id uuid NOT NULL,
  driver_id uuid,
  type public.dvir_report_type NOT NULL,
  status public.dvir_status NOT NULL DEFAULT 'draft',
  odometer_miles numeric,
  engine_hours numeric,
  location_gps point,
  items jsonb NOT NULL DEFAULT '{}'::jsonb,
  defects_count integer NOT NULL DEFAULT 0,
  major_defect_present boolean NOT NULL DEFAULT false,
  out_of_service_flag boolean NOT NULL DEFAULT false,
  submitted_at timestamptz,
  verified_by uuid,
  verified_at timestamptz,
  rejected_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- DVIR defects
CREATE TABLE IF NOT EXISTS public.dvir_defects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  dvir_id uuid NOT NULL REFERENCES public.dvir_reports(id) ON DELETE CASCADE,
  asset_type public.dvir_asset_type NOT NULL,
  asset_id uuid NOT NULL,
  item_key text NOT NULL,
  severity public.defect_severity NOT NULL,
  notes text,
  photos text[] DEFAULT '{}',
  work_order_id uuid,
  status public.defect_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  closed_at timestamptz,
  closed_by uuid
);

-- Work orders
CREATE TABLE IF NOT EXISTS public.work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  source public.work_order_source NOT NULL,
  asset_type public.dvir_asset_type NOT NULL,
  asset_id uuid NOT NULL,
  priority public.work_order_priority NOT NULL DEFAULT 'normal',
  status public.work_order_status NOT NULL DEFAULT 'open',
  opened_by uuid,
  opened_at timestamptz NOT NULL DEFAULT now(),
  assigned_to uuid,
  due_date timestamptz,
  meter_open_miles integer,
  meter_open_hours integer,
  meter_close_miles integer,
  meter_close_hours integer,
  description text,
  resolution_notes text,
  driver_verification_required boolean NOT NULL DEFAULT true,
  attachments text[] DEFAULT '{}',
  total_parts_cost numeric NOT NULL DEFAULT 0,
  total_labor_hours numeric NOT NULL DEFAULT 0,
  labor_rate numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  closed_by uuid
);

CREATE TABLE IF NOT EXISTS public.work_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  line_type text NOT NULL CHECK (line_type IN ('part','labor','misc')),
  sku text,
  description text NOT NULL,
  qty numeric,
  unit_cost numeric,
  hours numeric,
  total numeric
);

CREATE TABLE IF NOT EXISTS public.work_order_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- PM schedules
CREATE TABLE IF NOT EXISTS public.pm_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  description text,
  trigger_miles_every integer,
  trigger_hours_every integer,
  trigger_days_every integer,
  grace_miles integer NOT NULL DEFAULT 0,
  grace_hours integer NOT NULL DEFAULT 0,
  grace_days integer NOT NULL DEFAULT 0,
  auto_create_work_order boolean NOT NULL DEFAULT true,
  default_priority public.work_order_priority NOT NULL DEFAULT 'normal',
  instructions jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pm_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pm_schedule_id uuid NOT NULL REFERENCES public.pm_schedules(id) ON DELETE CASCADE,
  target_type public.pm_target_type NOT NULL,
  target_id uuid NOT NULL,
  last_done_miles integer,
  last_done_hours integer,
  last_done_date date,
  next_due_miles integer,
  next_due_hours integer,
  next_due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pm_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pm_schedule_id uuid NOT NULL REFERENCES public.pm_schedules(id) ON DELETE SET NULL,
  asset_id uuid NOT NULL,
  work_order_id uuid REFERENCES public.work_orders(id) ON DELETE SET NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  meter_miles integer,
  meter_hours integer,
  notes text
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dvir_reports_asset ON public.dvir_reports(asset_type, asset_id);
CREATE INDEX IF NOT EXISTS idx_dvir_defects_asset ON public.dvir_defects(asset_type, asset_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_asset ON public.work_orders(asset_type, asset_id);
CREATE INDEX IF NOT EXISTS idx_pm_targets_schedule ON public.pm_targets(pm_schedule_id);

-- Updated_at triggers using existing helper if present
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_timestamp') THEN
    CREATE TRIGGER trg_dvir_reports_updated_at
      BEFORE UPDATE ON public.dvir_reports
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_timestamp();
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_timestamp') THEN
    CREATE TRIGGER trg_work_orders_updated_at
      BEFORE UPDATE ON public.work_orders
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_timestamp();
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_timestamp') THEN
    CREATE TRIGGER trg_pm_schedules_updated_at
      BEFORE UPDATE ON public.pm_schedules
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_timestamp();
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_timestamp') THEN
    CREATE TRIGGER trg_pm_targets_updated_at
      BEFORE UPDATE ON public.pm_targets
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_timestamp();
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RPCs
CREATE OR REPLACE FUNCTION public.open_work_order_for_defect(defect_uuid uuid, _opened_by uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  d RECORD;
  new_wo_id uuid;
BEGIN
  SELECT * INTO d FROM public.dvir_defects WHERE id = defect_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Defect not found';
  END IF;

  INSERT INTO public.work_orders (
    company_id, source, asset_type, asset_id, priority, status, opened_by, description
  ) VALUES (
    d.company_id, 'dvir_defect', d.asset_type, d.asset_id,
    CASE WHEN d.severity = 'major' THEN 'critical' ELSE 'normal' END,
    'open', _opened_by,
    'Auto-created from DVIR defect ' || d.item_key
  ) RETURNING id INTO new_wo_id;

  UPDATE public.dvir_defects SET work_order_id = new_wo_id, status = 'in_work' WHERE id = defect_uuid;

  -- If major defect, mark vehicle out_of_service true
  IF d.asset_type = 'vehicle' AND d.severity = 'major' THEN
    UPDATE public.vehicles SET out_of_service = true WHERE id = d.asset_id;
  END IF;

  RETURN new_wo_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_work_order(work_order_uuid uuid, _closed_by uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  wo RECORD;
  major_open_count integer := 0;
BEGIN
  SELECT * INTO wo FROM public.work_orders WHERE id = work_order_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Work order not found';
  END IF;

  UPDATE public.work_orders
    SET status = 'completed', closed_at = now(), closed_by = _closed_by
  WHERE id = work_order_uuid;

  -- Close linked defects
  UPDATE public.dvir_defects
    SET status = 'closed', closed_at = now(), closed_by = _closed_by
  WHERE work_order_id = work_order_uuid;

  -- If vehicle, clear OOS if no remaining major open defects
  IF wo.asset_type = 'vehicle' THEN
    SELECT COUNT(*) INTO major_open_count
    FROM public.dvir_defects
    WHERE asset_type = 'vehicle' AND asset_id = wo.asset_id AND severity = 'major' AND status != 'closed';

    IF major_open_count = 0 THEN
      UPDATE public.vehicles SET out_of_service = false, pending_driver_verification = false WHERE id = wo.asset_id;
    ELSE
      UPDATE public.vehicles SET pending_driver_verification = true WHERE id = wo.asset_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;