-- Replace sync_clerk_profile by dropping first (signature with five text params)
DROP FUNCTION IF EXISTS public.sync_clerk_profile(text, text, text, text, text);

-- Recreate with correct implementation returning UUID and setting id
CREATE FUNCTION public.sync_clerk_profile(
  clerk_user_id_param text,
  email_param text,
  first_name_param text,
  last_name_param text,
  image_url_param text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_id uuid;
BEGIN
  INSERT INTO public.profiles (
    id,
    clerk_user_id,
    email,
    first_name,
    last_name,
    image_url,
    is_active,
    status
  ) VALUES (
    gen_random_uuid(),
    clerk_user_id_param,
    email_param,
    first_name_param,
    last_name_param,
    COALESCE(image_url_param, ''),
    true,
    'active'
  )
  ON CONFLICT (clerk_user_id)
  DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    image_url = COALESCE(EXCLUDED.image_url, public.profiles.image_url),
    updated_at = now()
  RETURNING id INTO profile_id;

  RETURN profile_id;
END;
$$;