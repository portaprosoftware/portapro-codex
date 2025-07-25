-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_customer_notes_with_users(uuid);

-- Add a new column for clerk_user_id to customer_notes table
ALTER TABLE public.customer_notes ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Update existing records to use clerk_user_id from user_roles mapping
UPDATE public.customer_notes 
SET clerk_user_id = ur.clerk_user_id 
FROM public.user_roles ur 
WHERE customer_notes.created_by = ur.user_id AND ur.clerk_user_id IS NOT NULL;

-- Now we can drop the old created_by column and rename the new one
ALTER TABLE public.customer_notes DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.customer_notes RENAME COLUMN clerk_user_id TO created_by;

-- Create the updated RPC function to work with clerk_user_id
CREATE OR REPLACE FUNCTION public.get_customer_notes_with_users(customer_uuid uuid)
RETURNS TABLE(
  id uuid,
  customer_id uuid,
  note_text text,
  is_important boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  created_by text,
  user_first_name text,
  user_last_name text,
  user_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    ur.first_name as user_first_name,
    ur.last_name as user_last_name,
    ur.email as user_email
  FROM public.customer_notes cn
  LEFT JOIN public.user_roles ur ON cn.created_by = ur.clerk_user_id
  WHERE cn.customer_id = customer_uuid
  ORDER BY cn.created_at DESC;
END;
$function$;

-- Create a function to ensure users are properly registered when they first interact with the system
CREATE OR REPLACE FUNCTION public.ensure_user_registered(
  clerk_user_id_param TEXT,
  first_name_param TEXT DEFAULT NULL,
  last_name_param TEXT DEFAULT NULL,
  email_param TEXT DEFAULT NULL,
  role_param TEXT DEFAULT 'owner'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_uuid uuid;
BEGIN
  -- Check if user already exists
  SELECT user_id INTO user_uuid 
  FROM public.user_roles 
  WHERE clerk_user_id = clerk_user_id_param;
  
  -- If user doesn't exist, create them
  IF user_uuid IS NULL THEN
    -- Generate new UUID for the user
    user_uuid := gen_random_uuid();
    
    -- Insert into user_roles
    INSERT INTO public.user_roles (
      user_id, 
      clerk_user_id, 
      role, 
      first_name, 
      last_name, 
      email
    ) VALUES (
      user_uuid,
      clerk_user_id_param,
      role_param::app_role,
      first_name_param,
      last_name_param,
      email_param
    );
  END IF;
  
  RETURN user_uuid;
END;
$function$;