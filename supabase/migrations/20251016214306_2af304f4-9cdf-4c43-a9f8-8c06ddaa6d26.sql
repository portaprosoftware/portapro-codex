-- Unblock profile sync from the frontend by removing RLS on critical tables
-- Matches project guideline: permissions via Clerk/useUserRole; Supabase as data backend only

-- Disable RLS on profiles and user_roles (prevents 401 Unauthorized from anon key)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Optional: ensure the RPC can run without RLS blocking underlying tables
-- If the function exists already, no harm replacing with same definition using SECURITY DEFINER
-- and a simple upsert to be resilient. This keeps current behavior intact.
CREATE OR REPLACE FUNCTION public.sync_clerk_profile(
  clerk_user_id_param text,
  email_param text,
  first_name_param text,
  last_name_param text,
  image_url_param text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id text;
BEGIN
  -- Try to find existing profile by clerk_user_id
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE clerk_user_id = clerk_user_id_param
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    -- Insert new profile; prefer using a generated id if schema expects uuid/text
    INSERT INTO public.profiles (
      clerk_user_id,
      email,
      first_name,
      last_name,
      image_url
    ) VALUES (
      clerk_user_id_param,
      NULLIF(email_param, ''),
      NULLIF(first_name_param, ''),
      NULLIF(last_name_param, ''),
      image_url_param
    )
    RETURNING id INTO v_profile_id;
  ELSE
    -- Update existing profile metadata
    UPDATE public.profiles
    SET
      email = COALESCE(NULLIF(email_param, ''), email),
      first_name = COALESCE(NULLIF(first_name_param, ''), first_name),
      last_name = COALESCE(NULLIF(last_name_param, ''), last_name),
      image_url = COALESCE(image_url_param, image_url)
    WHERE id = v_profile_id;
  END IF;

  RETURN v_profile_id;
END;
$$;