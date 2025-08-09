
-- 1) Extend profiles: team and location fields + optional phone, hire_date
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS team_assignment text,
  ADD COLUMN IF NOT EXISTS work_location_id uuid REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS hire_date date;

-- Ensure RLS is enabled (non-destructive if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow owners/dispatchers/admins to update profiles (including new fields)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can update profiles'
  ) THEN
    CREATE POLICY "Admins can update profiles"
      ON public.profiles
      FOR UPDATE
      USING (
        public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'owner')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'dispatcher')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'admin')
      )
      WITH CHECK (
        public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'owner')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'dispatcher')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'admin')
      );
  END IF;
END$$;

-- 2) Shift templates (reusable shifts)
CREATE TABLE IF NOT EXISTS public.shift_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  shift_type text NOT NULL,         -- e.g., 'driver', 'warehouse', 'office'
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;

-- Admins can see/manage templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='shift_templates' AND policyname='Anyone can select templates'
  ) THEN
    CREATE POLICY "Anyone can select templates"
      ON public.shift_templates
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='shift_templates' AND policyname='Admins can insert templates'
  ) THEN
    CREATE POLICY "Admins can insert templates"
      ON public.shift_templates
      FOR INSERT
      TO authenticated
      WITH CHECK (
        public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'owner')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'dispatcher')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'admin')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='shift_templates' AND policyname='Admins can update templates'
  ) THEN
    CREATE POLICY "Admins can update templates"
      ON public.shift_templates
      FOR UPDATE
      TO authenticated
      USING (
        public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'owner')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'dispatcher')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'admin')
      )
      WITH CHECK (
        public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'owner')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'dispatcher')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'admin')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='shift_templates' AND policyname='Admins can delete templates'
  ) THEN
    CREATE POLICY "Admins can delete templates"
      ON public.shift_templates
      FOR DELETE
      TO authenticated
      USING (
        public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'owner')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'dispatcher')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'admin')
      );
  END IF;
END$$;

-- update timestamp trigger for shift_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_shift_templates_updated_at'
  ) THEN
    CREATE TRIGGER trg_shift_templates_updated_at
    BEFORE UPDATE ON public.shift_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_timestamp();
  END IF;
END$$;

-- 3) Scheduled shifts (assign templates to date/driver)
CREATE TABLE IF NOT EXISTS public.scheduled_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_date date NOT NULL,
  template_id uuid NOT NULL REFERENCES public.shift_templates(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',  -- pending | confirmed | conflict | cancelled
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_shifts ENABLE ROW LEVEL SECURITY;

-- RLS: admins see/manage all; drivers see their own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='scheduled_shifts' AND policyname='Admins can select scheduled_shifts'
  ) THEN
    CREATE POLICY "Admins can select scheduled_shifts"
      ON public.scheduled_shifts
      FOR SELECT
      TO authenticated
      USING (
        public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'owner')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'dispatcher')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'admin')
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = scheduled_shifts.assigned_to
            AND p.clerk_user_id = auth.jwt()->>'sub'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='scheduled_shifts' AND policyname='Admins can insert scheduled_shifts'
  ) THEN
    CREATE POLICY "Admins can insert scheduled_shifts"
      ON public.scheduled_shifts
      FOR INSERT
      TO authenticated
      WITH CHECK (
        public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'owner')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'dispatcher')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'admin')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='scheduled_shifts' AND policyname='Admins can update scheduled_shifts'
  ) THEN
    CREATE POLICY "Admins can update scheduled_shifts"
      ON public.scheduled_shifts
      FOR UPDATE
      TO authenticated
      USING (
        public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'owner')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'dispatcher')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'admin')
      )
      WITH CHECK (
        public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'owner')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'dispatcher')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'admin')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='scheduled_shifts' AND policyname='Admins can delete scheduled_shifts'
  ) THEN
    CREATE POLICY "Admins can delete scheduled_shifts"
      ON public.scheduled_shifts
      FOR DELETE
      TO authenticated
      USING (
        public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'owner')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'dispatcher')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'admin')
      );
  END IF;
END$$;

-- update timestamp trigger for scheduled_shifts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_scheduled_shifts_updated_at'
  ) THEN
    CREATE TRIGGER trg_scheduled_shifts_updated_at
    BEFORE UPDATE ON public.scheduled_shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_timestamp();
  END IF;
END$$;

-- 4) Training requirements mapping (role -> document type)
CREATE TABLE IF NOT EXISTS public.training_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type_id uuid NOT NULL REFERENCES public.compliance_document_types(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,          -- e.g., 'driver'
  frequency_months integer NOT NULL DEFAULT 12,
  mandatory boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_type_id, role)
);

ALTER TABLE public.training_requirements ENABLE ROW LEVEL SECURITY;

-- Anyone can view requirements; admins manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_requirements' AND policyname='Anyone can select training_requirements'
  ) THEN
    CREATE POLICY "Anyone can select training_requirements"
      ON public.training_requirements
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='training_requirements' AND policyname='Admins can insert/update/delete training_requirements'
  ) THEN
    CREATE POLICY "Admins can insert/update/delete training_requirements"
      ON public.training_requirements
      FOR ALL
      TO authenticated
      USING (
        public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'owner')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'dispatcher')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'admin')
      )
      WITH CHECK (
        public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'owner')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'dispatcher')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'admin')
      );
  END IF;
END$$;

-- update timestamp trigger for training_requirements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_training_requirements_updated_at'
  ) THEN
    CREATE TRIGGER trg_training_requirements_updated_at
    BEFORE UPDATE ON public.training_requirements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_timestamp();
  END IF;
END$$;

-- 5) Time Off approvals by admins (if RLS is enabled on driver_time_off_requests)
ALTER TABLE public.driver_time_off_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='driver_time_off_requests' AND policyname='Admins can approve/deny time off'
  ) THEN
    CREATE POLICY "Admins can approve/deny time off"
      ON public.driver_time_off_requests
      FOR UPDATE
      TO authenticated
      USING (
        public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'owner')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'dispatcher')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'admin')
      )
      WITH CHECK (
        public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'owner')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'dispatcher')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'admin')
      );
  END IF;

  -- Optional: drivers can insert their own requests
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='driver_time_off_requests' AND policyname='Drivers can insert their own requests'
  ) THEN
    CREATE POLICY "Drivers can insert their own requests"
      ON public.driver_time_off_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = driver_time_off_requests.driver_id
            AND p.clerk_user_id = auth.jwt()->>'sub'
        )
      );
  END IF;

  -- Drivers and admins can view requests (admin all; driver only own)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='driver_time_off_requests' AND policyname='Admins can view all time off'
  ) THEN
    CREATE POLICY "Admins can view all time off"
      ON public.driver_time_off_requests
      FOR SELECT
      TO authenticated
      USING (
        public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'owner')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'dispatcher')
        OR public.clerk_user_has_role_simple(auth.jwt()->>'sub', 'admin')
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = driver_time_off_requests.driver_id
            AND p.clerk_user_id = auth.jwt()->>'sub'
        )
      );
  END IF;
END$$;
