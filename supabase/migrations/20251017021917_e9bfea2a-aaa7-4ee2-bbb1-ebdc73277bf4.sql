-- Set default UUID generation for profiles.id to prevent null constraint errors
ALTER TABLE public.profiles 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add unique constraint on clerk_user_id for safe upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS profiles_clerk_user_id_key 
ON public.profiles (clerk_user_id);