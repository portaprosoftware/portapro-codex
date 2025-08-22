-- Create quote_drafts table separate from job_drafts
CREATE TABLE public.quote_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quote_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add trigger for updated_at
CREATE TRIGGER update_quote_drafts_updated_at
  BEFORE UPDATE ON public.quote_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing quote drafts from job_drafts to quote_drafts
INSERT INTO public.quote_drafts (name, quote_data, created_by, created_at, updated_at)
SELECT 
  name,
  job_data as quote_data,
  created_by,
  created_at,
  updated_at
FROM public.job_drafts
WHERE job_data->>'wizardMode' = 'quote';

-- Remove quote drafts from job_drafts table
DELETE FROM public.job_drafts 
WHERE job_data->>'wizardMode' = 'quote';