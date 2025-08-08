-- 1) Add feature flag to company_settings
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS enable_sanitation_compliance boolean NOT NULL DEFAULT false;

-- 2) Sanitation core tables (no RLS)
CREATE TABLE IF NOT EXISTS public.sanitation_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  region text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sanitation_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.sanitation_checklists(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  label text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(checklist_id, item_key)
);

-- Store per-service sanitation results linked to jobs and units (product_items)
CREATE TABLE IF NOT EXISTS public.sanitation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  product_item_id uuid REFERENCES public.product_items(id) ON DELETE SET NULL,
  checklist_id uuid REFERENCES public.sanitation_checklists(id) ON DELETE SET NULL,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb, -- array of storage paths/urls
  technician_id text, -- Clerk user id (string)
  signed_at timestamptz,
  gps point,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sanitation_logs_job ON public.sanitation_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_sanitation_logs_item ON public.sanitation_logs(product_item_id);
CREATE INDEX IF NOT EXISTS idx_sanitation_logs_checklist ON public.sanitation_logs(checklist_id);

-- Scheduling rules for auto-creating/validating sanitation tasks (Phase 2 automation)
CREATE TABLE IF NOT EXISTS public.sanitation_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'customer', -- 'customer' | 'service_location' | 'unit'
  target_id uuid NOT NULL,                -- references customers.id, customer_service_locations.id, or product_items.id (no FK to stay flexible)
  checklist_id uuid REFERENCES public.sanitation_checklists(id) ON DELETE SET NULL,
  frequency_days integer NOT NULL DEFAULT 7,
  double_per_week boolean NOT NULL DEFAULT false,
  next_run_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_sanitation_schedules_scope_target ON public.sanitation_schedules(scope, target_id);

-- Optional updated_at trigger function (generic) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_timestamp'
  ) THEN
    CREATE OR REPLACE FUNCTION public.update_updated_at_timestamp()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$ LANGUAGE plpgsql;

-- Attach triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sanitation_checklists_updated_at'
  ) THEN
    CREATE TRIGGER trg_sanitation_checklists_updated_at
    BEFORE UPDATE ON public.sanitation_checklists
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sanitation_checklist_items_updated_at'
  ) THEN
    CREATE TRIGGER trg_sanitation_checklist_items_updated_at
    BEFORE UPDATE ON public.sanitation_checklist_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sanitation_logs_updated_at'
  ) THEN
    CREATE TRIGGER trg_sanitation_logs_updated_at
    BEFORE UPDATE ON public.sanitation_logs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sanitation_schedules_updated_at'
  ) THEN
    CREATE TRIGGER trg_sanitation_schedules_updated_at
    BEFORE UPDATE ON public.sanitation_schedules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_timestamp();
  END IF;
END $$ LANGUAGE plpgsql;