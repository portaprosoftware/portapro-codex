-- Drop and recreate sync_clerk_profile to fix type mismatch

DROP FUNCTION IF EXISTS public.sync_clerk_profile(text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.sync_clerk_profile(
  clerk_user_id_param text,
  email_param text,
  first_name_param text,
  last_name_param text,
  image_url_param text
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing_id text;
BEGIN
  -- Try to find existing profile by clerk_user_id OR id (for older data)
  SELECT id INTO v_existing_id
  FROM public.profiles
  WHERE clerk_user_id = clerk_user_id_param
     OR id = clerk_user_id_param
  LIMIT 1;

  IF v_existing_id IS NULL THEN
    -- Insert new profile using Clerk user ID as the primary key (text)
    INSERT INTO public.profiles (id, clerk_user_id, email, first_name, last_name, image_url)
    VALUES (
      clerk_user_id_param,
      clerk_user_id_param,
      NULLIF(TRIM(email_param), ''),
      NULLIF(TRIM(first_name_param), ''),
      NULLIF(TRIM(last_name_param), ''),
      NULLIF(TRIM(image_url_param), '')
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      image_url = EXCLUDED.image_url;

    RETURN clerk_user_id_param;
  ELSE
    -- Update the existing profile with any new values provided
    UPDATE public.profiles
    SET 
      email = COALESCE(NULLIF(TRIM(email_param), ''), email),
      first_name = COALESCE(NULLIF(TRIM(first_name_param), ''), first_name),
      last_name = COALESCE(NULLIF(TRIM(last_name_param), ''), last_name),
      image_url = COALESCE(NULLIF(TRIM(image_url_param), ''), image_url)
    WHERE id = v_existing_id;

    RETURN v_existing_id;
  END IF;
END;
$$;