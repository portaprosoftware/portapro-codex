-- Add missing columns to existing organizations table
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS subdomain TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create unique constraint on subdomain if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organizations_subdomain_key'
  ) THEN
    ALTER TABLE public.organizations ADD CONSTRAINT organizations_subdomain_key UNIQUE (subdomain);
  END IF;
END $$;