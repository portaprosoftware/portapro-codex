
-- Enable RLS on profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owners can delete profiles" ON public.profiles;

-- Allow everyone to view all profiles (needed for driver directories, user lists, etc.)
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- Allow admin/dispatcher to delete any profile
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (auth.jwt() ->> 'sub')::text
    AND role IN ('admin', 'dispatcher')
  )
);

-- Also add a policy for user_roles table to allow admins to delete roles
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (auth.jwt() ->> 'sub')::text
    AND ur.role IN ('admin', 'dispatcher')
  )
);
