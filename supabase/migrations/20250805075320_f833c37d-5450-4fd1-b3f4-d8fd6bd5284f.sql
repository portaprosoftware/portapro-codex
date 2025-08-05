-- Create campaign_drafts table for saving campaign progress
CREATE TABLE public.campaign_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  campaign_name TEXT,
  campaign_description TEXT,
  audience_type TEXT,
  current_step INTEGER DEFAULT 1,
  draft_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trigger for updated_at
CREATE TRIGGER update_campaign_drafts_updated_at
  BEFORE UPDATE ON public.campaign_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_campaign_drafts_updated_at();