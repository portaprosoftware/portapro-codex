-- Fix existing function signature by dropping and recreating
DROP FUNCTION IF EXISTS public.sync_clerk_profile(text, text, text, text, text);

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
  SELECT id INTO existing_id
  FROM public.profiles
  WHERE clerk_user_id = clerk_user_id_param
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      email = COALESCE(email_param, email),
      first_name = COALESCE(first_name_param, first_name),
      last_name = COALESCE(last_name_param, last_name)
    WHERE id = existing_id;
  ELSE
    INSERT INTO public.profiles (id, clerk_user_id, email, first_name, last_name)
    VALUES (gen_random_uuid(), clerk_user_id_param, email_param, first_name_param, last_name_param)
    RETURNING id INTO existing_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'profile_id', existing_id::text);
END;
$$;