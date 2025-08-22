CREATE OR REPLACE FUNCTION public.sync_clerk_profile(
  clerk_user_id_param text,
  email_param text,
  first_name_param text,
  last_name_param text,
  image_url_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update the profile
  INSERT INTO public.profiles (
    clerk_user_id,
    email,
    first_name,
    last_name,
    image_url,
    created_at,
    updated_at
  ) VALUES (
    clerk_user_id_param,
    email_param,
    first_name_param,
    last_name_param,
    image_url_param,
    now(),
    now()
  )
  ON CONFLICT (clerk_user_id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    image_url = EXCLUDED.image_url,
    updated_at = now();
END;
$$;