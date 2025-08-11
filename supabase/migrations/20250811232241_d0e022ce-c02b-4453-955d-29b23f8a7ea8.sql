-- Update Tyler's profile with current Clerk User ID
UPDATE public.profiles 
SET clerk_user_id = 'user_30FClXyCW7a19ZYHhyT7GQPcwyQ',
    updated_at = now()
WHERE first_name = 'Tyler' AND last_name = 'Douglas';

-- Create function to sync profile from Clerk
CREATE OR REPLACE FUNCTION public.sync_clerk_profile(
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
  -- Insert or update profile
  INSERT INTO public.profiles (
    id,
    clerk_user_id,
    email,
    first_name,
    last_name,
    profile_photo,
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
  )
  ON CONFLICT (clerk_user_id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    profile_photo = COALESCE(EXCLUDED.profile_photo, profiles.profile_photo),
    updated_at = now()
  RETURNING id INTO profile_id;

  -- Ensure owner role exists for Tyler (first user)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = profile_id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (profile_id, 'owner');
  END IF;

  RETURN profile_id;
END;
$$;