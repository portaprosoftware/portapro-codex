-- Create or replace RPC to sync Clerk profile into public.profiles
-- This avoids type mismatches by comparing text-to-text (clerk_user_id is text)
CREATE OR REPLACE FUNCTION public.sync_clerk_profile(
  clerk_user_id_param text,
  email_param text,
  first_name_param text,
  last_name_param text,
  image_url_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  existing_id uuid;
BEGIN
  -- Try to find existing profile by Clerk user id (text)
  SELECT id INTO existing_id
  FROM public.profiles
  WHERE clerk_user_id = clerk_user_id_param
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    -- Update basic fields if record exists
    UPDATE public.profiles
    SET 
      email = COALESCE(email_param, email),
      first_name = COALESCE(first_name_param, first_name),
      last_name = COALESCE(last_name_param, last_name)
    WHERE id = existing_id;
  ELSE
    -- Insert minimal profile if missing
    INSERT INTO public.profiles (id, clerk_user_id, email, first_name, last_name)
    VALUES (gen_random_uuid(), clerk_user_id_param, email_param, first_name_param, last_name_param)
    RETURNING id INTO existing_id;
  END IF;

  -- Return a simple success payload
  RETURN jsonb_build_object('success', true, 'profile_id', existing_id::text);
END;
$$;