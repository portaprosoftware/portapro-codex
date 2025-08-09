
-- 1) Performance indexes for decon_logs
CREATE INDEX IF NOT EXISTS decon_logs_performed_at_desc_idx
  ON public.decon_logs (performed_at DESC);

CREATE INDEX IF NOT EXISTS decon_logs_incident_id_idx
  ON public.decon_logs (incident_id);

-- Add FK if not already present (safe to create with IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'decon_logs_incident_fk'
  ) THEN
    ALTER TABLE public.decon_logs
      ADD CONSTRAINT decon_logs_incident_fk
      FOREIGN KEY (incident_id)
      REFERENCES public.spill_incident_reports (id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 2) New table to record spill kit checks by dispatch (and drivers if desired)
CREATE TABLE IF NOT EXISTS public.vehicle_spill_kit_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  has_kit boolean NOT NULL,
  contents jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  checked_at timestamptz NOT NULL DEFAULT now(),
  checked_by_clerk text, -- Clerk user id string
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS vehicle_spill_kit_checks_vehicle_checked_at_idx
  ON public.vehicle_spill_kit_checks (vehicle_id, checked_at DESC);

-- Enable RLS but keep permissive policies to match current anon-key usage
ALTER TABLE public.vehicle_spill_kit_checks ENABLE ROW LEVEL SECURITY;

-- Allow read for anonymous (frontend anon key)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vehicle_spill_kit_checks'
      AND policyname = 'allow_read_vehicle_spill_kit_checks'
  ) THEN
    CREATE POLICY "allow_read_vehicle_spill_kit_checks"
      ON public.vehicle_spill_kit_checks
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Allow insert for anonymous (frontend anon key). Adjust later when auth is added.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vehicle_spill_kit_checks'
      AND policyname = 'allow_insert_vehicle_spill_kit_checks'
  ) THEN
    CREATE POLICY "allow_insert_vehicle_spill_kit_checks"
      ON public.vehicle_spill_kit_checks
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Allow update for anonymous (frontend anon key). We can tighten to roles later.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vehicle_spill_kit_checks'
      AND policyname = 'allow_update_vehicle_spill_kit_checks'
  ) THEN
    CREATE POLICY "allow_update_vehicle_spill_kit_checks"
      ON public.vehicle_spill_kit_checks
      FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Optional: automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_vehicle_spill_kit_checks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_update_vehicle_spill_kit_checks_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_vehicle_spill_kit_checks_updated_at
    BEFORE UPDATE ON public.vehicle_spill_kit_checks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_vehicle_spill_kit_checks_updated_at();
  END IF;
END $$;
