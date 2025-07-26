-- Clean up duplicate role records and add unique constraint
-- First, keep only the most recent role for each user (in case of duplicates)
DELETE FROM public.user_roles ur1
WHERE ur1.id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.user_roles ur2
  WHERE ur2.user_id = ur1.user_id
  ORDER BY user_id, created_at DESC
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);