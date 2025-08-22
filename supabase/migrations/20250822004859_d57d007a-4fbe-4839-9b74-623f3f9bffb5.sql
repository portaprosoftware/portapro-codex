
-- 1) Ensure profiles has the columns used by sync and invitation flows
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS clerk_user_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Helpful index if UNIQUE wasn’t created automatically
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'idx_profiles_clerk_user_id'
  ) THEN
    CREATE INDEX idx_profiles_clerk_user_id ON public.profiles(clerk_user_id);
  END IF;
END$$;

-- 2) Bring user_invitations to parity with the edge function’s insert
ALTER TABLE public.user_invitations
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS invited_by text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'driver',
  ADD COLUMN IF NOT EXISTS invitation_token text,
  ADD COLUMN IF NOT EXISTS clerk_user_id text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS invitation_type text DEFAULT 'user_creation',
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Unique invitation token if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.user_invitations'::regclass
      AND conname = 'unique_invitation_token'
  ) THEN
    ALTER TABLE public.user_invitations
      ADD CONSTRAINT unique_invitation_token UNIQUE (invitation_token);
  END IF;
END$$;

-- Helpful indexes for admin views
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'idx_user_invitations_email'
  ) THEN
    CREATE INDEX idx_user_invitations_email ON public.user_invitations(email);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'idx_user_invitations_status'
  ) THEN
    CREATE INDEX idx_user_invitations_status ON public.user_invitations(status);
  END IF;
END$$;

-- 3) Standard updated_at trigger for both tables (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profiles_updated_at'
  ) THEN
    CREATE TRIGGER trg_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_invitations_updated_at'
  ) THEN
    CREATE TRIGGER trg_user_invitations_updated_at
      BEFORE UPDATE ON public.user_invitations
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;
