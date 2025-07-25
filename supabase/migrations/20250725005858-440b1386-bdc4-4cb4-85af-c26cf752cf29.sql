-- Fix customer notes functions and user registration

-- First, create or update the get_customer_notes_with_users function to properly join with profiles
CREATE OR REPLACE FUNCTION public.get_customer_notes_with_users(customer_uuid uuid)
RETURNS TABLE(
  id uuid,
  customer_id uuid,
  note_text text,
  is_important boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  created_by uuid,
  updated_by uuid,
  user_first_name text,
  user_last_name text,
  user_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cn.id,
    cn.customer_id,
    cn.note_text,
    cn.is_important,
    cn.created_at,
    cn.updated_at,
    cn.created_by,
    cn.updated_by,
    p.first_name as user_first_name,
    p.last_name as user_last_name,
    p.email as user_email
  FROM public.customer_notes cn
  LEFT JOIN public.profiles p ON cn.created_by = p.id
  WHERE cn.customer_id = customer_uuid
  ORDER BY cn.created_at DESC;
END;
$$;

-- Create or update the ensure_user_registered function for Clerk users
CREATE OR REPLACE FUNCTION public.ensure_user_registered(
  clerk_user_id text,
  user_email text DEFAULT NULL,
  user_first_name text DEFAULT NULL,
  user_last_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid uuid;
  profile_exists boolean;
BEGIN
  -- Convert Clerk user ID to UUID
  user_uuid := clerk_user_id::uuid;
  
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_uuid) INTO profile_exists;
  
  -- If profile doesn't exist, create it
  IF NOT profile_exists THEN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (user_uuid, user_email, user_first_name, user_last_name)
    ON CONFLICT (id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, profiles.email),
      first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
      last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
      updated_at = now();
  END IF;
  
  RETURN user_uuid;
END;
$$;

-- Create a function specifically for adding customer notes
CREATE OR REPLACE FUNCTION public.add_customer_note(
  customer_uuid uuid,
  note_content text,
  is_important_flag boolean DEFAULT false,
  clerk_user_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  note_id uuid;
  user_uuid uuid;
BEGIN
  -- Ensure user is registered if clerk_user_id is provided
  IF clerk_user_id IS NOT NULL THEN
    user_uuid := public.ensure_user_registered(clerk_user_id);
  END IF;
  
  -- Insert the customer note
  INSERT INTO public.customer_notes (
    customer_id,
    note_text,
    is_important,
    created_by,
    updated_by
  ) VALUES (
    customer_uuid,
    note_content,
    is_important_flag,
    user_uuid,
    user_uuid
  ) RETURNING id INTO note_id;
  
  RETURN note_id;
END;
$$;

-- Create a function for updating customer notes
CREATE OR REPLACE FUNCTION public.update_customer_note(
  note_uuid uuid,
  note_content text,
  is_important_flag boolean DEFAULT false,
  clerk_user_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Ensure user is registered if clerk_user_id is provided
  IF clerk_user_id IS NOT NULL THEN
    user_uuid := public.ensure_user_registered(clerk_user_id);
  END IF;
  
  -- Update the customer note
  UPDATE public.customer_notes 
  SET 
    note_text = note_content,
    is_important = is_important_flag,
    updated_by = user_uuid,
    updated_at = now()
  WHERE id = note_uuid;
  
  RETURN FOUND;
END;
$$;