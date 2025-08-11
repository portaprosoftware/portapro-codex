-- Update user_roles table to properly link Clerk user IDs to roles
UPDATE public.user_roles 
SET clerk_user_id = (
  SELECT clerk_user_id 
  FROM public.profiles 
  WHERE profiles.id = user_roles.user_id
)
WHERE clerk_user_id IS NULL;