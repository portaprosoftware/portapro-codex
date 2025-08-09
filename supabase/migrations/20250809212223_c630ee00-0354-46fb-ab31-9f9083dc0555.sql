-- Minimal migration: create required tables and triggers only (no extra indexes)

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