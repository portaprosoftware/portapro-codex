-- Create job_drafts table for saving job wizard progress
CREATE TABLE public.job_drafts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  job_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS (following project pattern of no RLS policies per instructions)
ALTER TABLE public.job_drafts ENABLE ROW LEVEL SECURITY;

-- Add trigger for updated_at
CREATE TRIGGER update_job_drafts_updated_at
  BEFORE UPDATE ON public.job_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();