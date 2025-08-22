-- Create the sync_clerk_profile function that the invite-user edge function is trying to call
CREATE OR REPLACE FUNCTION public.sync_clerk_profile(
  clerk_user_id_param text,
  email_param text,
  first_name_param text,
  last_name_param text,
  image_url_param text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_id uuid;
BEGIN
  -- Insert or update the profile, returning the ID
  INSERT INTO public.profiles (
    clerk_user_id,
    email,
    first_name,
    last_name,
    image_url,
    is_active,
    status
  ) VALUES (
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
    image_url = COALESCE(EXCLUDED.image_url, profiles.image_url),
    updated_at = now()
  RETURNING id INTO profile_id;
  
  RETURN profile_id;
END;
$$;