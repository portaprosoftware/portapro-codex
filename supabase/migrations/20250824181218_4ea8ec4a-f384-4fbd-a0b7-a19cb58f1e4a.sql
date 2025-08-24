-- Add locks_count field to jobs table
ALTER TABLE public.jobs 
ADD COLUMN locks_count integer DEFAULT 0;