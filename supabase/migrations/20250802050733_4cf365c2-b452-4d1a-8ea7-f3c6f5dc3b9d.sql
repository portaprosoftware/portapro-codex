-- Add is_priority column to jobs table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' 
        AND column_name = 'is_priority'
    ) THEN
        ALTER TABLE public.jobs ADD COLUMN is_priority boolean NOT NULL DEFAULT false;
    END IF;
END $$;