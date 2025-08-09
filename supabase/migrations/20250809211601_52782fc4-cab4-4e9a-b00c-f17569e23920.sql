-- Idempotent creation of core tables for incidents and spill kits
-- (re-run safe)

-- Create spill incident reports table
CREATE TABLE IF NOT EXISTS public.spill_incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  vehicle_id uuid NULL REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id text NOT NULL,
  spill_type text NOT NULL,
  cause_description text NOT NULL,
  location_description text NULL,
  immediate_action_taken text NULL,
  authorities_notified boolean NOT NULL DEFAULT false,
  authority_contact_info text NULL,
  cleanup_method text NULL,
  cleanup_photos jsonb NULL DEFAULT '[]'::jsonb,
  disposal_method text NULL,
  volume_spilled numeric NULL,
  status text NOT NULL DEFAULT 'open',
  resolved_at timestamptz NULL,
  resolved_notes text NULL
);

-- Trigger to keep updated_at fresh
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_spill_incident_reports_updated_at'
  ) THEN
    CREATE TRIGGER trg_spill_incident_reports_updated_at
    BEFORE UPDATE ON public.spill_incident_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_timestamp();
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_spill_incident_reports_vehicle_id ON public.spill_incident_reports(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_spill_incident_reports_driver_id ON public.spill_incident_reports(driver_id);
CREATE INDEX IF NOT EXISTS idx_spill_incident_reports_created_at ON public.spill_incident_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spill_incident_reports_status ON public.spill_incident_reports(status);

-- Create vehicle spill kit checks table
CREATE TABLE IF NOT EXISTS public.vehicle_spill_kit_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  performed_at timestamptz NOT NULL DEFAULT now(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id text NOT NULL,
  all_items_present boolean NOT NULL DEFAULT false,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NULL,
  photos text[] NOT NULL DEFAULT '{}'::text[]
);

-- Trigger to keep updated_at fresh for vehicle_spill_kit_checks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vehicle_spill_kit_checks_updated_at'
  ) THEN
    CREATE TRIGGER trg_vehicle_spill_kit_checks_updated_at
    BEFORE UPDATE ON public.vehicle_spill_kit_checks
    FOR EACH ROW EXECUTE FUNCTION public.update_vehicle_spill_kit_checks_updated_at();
  END IF;
END $$;

-- Helpful indexes for vehicle_spill_kit_checks
CREATE INDEX IF NOT EXISTS idx_vehicle_spill_kit_checks_vehicle_id ON public.vehicle_spill_kit_checks(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_spill_kit_checks_performed_at ON public.vehicle_spill_kit_checks(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_spill_kit_checks_driver_id ON public.vehicle_spill_kit_checks(driver_id);

-- Conditionally add indexes to decon_logs if columns exist in this project
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'decon_logs' AND column_name = 'vehicle_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_decon_logs_vehicle_id ON public.decon_logs(vehicle_id);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'decon_logs' AND column_name = 'driver_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_decon_logs_driver_id ON public.decon_logs(driver_id);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'decon_logs' AND column_name = 'performed_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_decon_logs_performed_at ON public.decon_logs(performed_at DESC);
  END IF;
END $$;