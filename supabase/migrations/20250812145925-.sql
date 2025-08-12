-- Drop and recreate the sync_clerk_profile function
DROP FUNCTION IF EXISTS public.sync_clerk_profile(text,text,text,text,text);

CREATE OR REPLACE FUNCTION public.sync_clerk_profile(
  clerk_user_id_param TEXT,
  email_param TEXT,
  first_name_param TEXT,
  last_name_param TEXT,
  image_url_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Insert or update profile
  INSERT INTO public.profiles (
    clerk_user_id,
    email,
    first_name,
    last_name,
    profile_photo,
    updated_at
  ) VALUES (
    clerk_user_id_param,
    email_param,
    first_name_param,
    last_name_param,
    image_url_param,
    NOW()
  )
  ON CONFLICT (clerk_user_id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    profile_photo = EXCLUDED.profile_photo,
    updated_at = NOW()
  RETURNING * INTO profile_record;
  
  RETURN json_build_object(
    'success', true,
    'profile_id', profile_record.id,
    'message', 'Profile synced successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;