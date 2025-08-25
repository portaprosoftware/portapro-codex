-- Create quote_drafts table similar to job_drafts
CREATE TABLE public.quote_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quote_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add trigger for updated_at
CREATE TRIGGER update_quote_drafts_updated_at
  BEFORE UPDATE ON public.quote_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();