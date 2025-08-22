-- Fix migration error by dropping existing RPC with different return type, then re-creating
-- 1) Ensure user_invitations can store Clerk IDs as text
DO $$
BEGIN
  -- invited_by -> text if currently not text
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_invitations' 
      AND column_name = 'invited_by' 
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.user_invitations 
      ALTER COLUMN invited_by TYPE text USING invited_by::text;
  END IF;

  -- clerk_user_id -> text if currently not text
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_invitations' 
      AND column_name = 'clerk_user_id' 
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.user_invitations 
      ALTER COLUMN clerk_user_id TYPE text USING clerk_user_id::text;
  END IF;
END
$$;

-- 2) Index for lookups by clerk_user_id (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND indexname = 'idx_user_invitations_clerk_user_id'
  ) THEN
    CREATE INDEX idx_user_invitations_clerk_user_id 
      ON public.user_invitations (clerk_user_id);
  END IF;
END
$$;

-- 3) Replace RPC to upsert profiles safely (drop then create)
DROP FUNCTION IF EXISTS public.sync_clerk_profile(text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.sync_clerk_profile(
  clerk_user_id_param text,
  email_param text,
  first_name_param text,
  last_name_param text,
  image_url_param text
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  existing_id uuid;
BEGIN
  SELECT id INTO existing_id
  FROM public.profiles
  WHERE clerk_user_id = clerk_user_id_param
  LIMIT 1;

  IF existing_id IS NULL THEN
    INSERT INTO public.profiles (
      id,
      clerk_user_id,
      email,
      first_name,
      last_name,
      image_url,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      clerk_user_id_param,
      email_param,
      first_name_param,
      last_name_param,
      image_url_param,
      now(),
      now()
    );
  ELSE
    UPDATE public.profiles
    SET 
      email = email_param,
      first_name = first_name_param,
      last_name = last_name_param,
      image_url = image_url_param,
      updated_at = now()
    WHERE id = existing_id;
  END IF;
END;
$$;