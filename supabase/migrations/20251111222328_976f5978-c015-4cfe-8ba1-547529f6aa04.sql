-- Add organization_id to marketing_campaigns (verify it exists as text)
-- This is a safety check migration to ensure organization_id is text type

-- First check if organization_id exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marketing_campaigns' 
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.marketing_campaigns 
    ADD COLUMN organization_id TEXT;
  END IF;
END $$;

-- Ensure organization_id is TEXT type (not UUID)
ALTER TABLE public.marketing_campaigns 
ALTER COLUMN organization_id TYPE TEXT USING organization_id::TEXT;

-- Ensure marketing_campaign_events organization_id is also TEXT
ALTER TABLE public.marketing_campaign_events 
ALTER COLUMN organization_id TYPE TEXT USING organization_id::TEXT;

-- Add index for campaign_id and event_type if not exists
CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign_type 
ON public.marketing_campaign_events(campaign_id, event_type);

-- Add index for organization_id if not exists
CREATE INDEX IF NOT EXISTS idx_campaign_events_org_id 
ON public.marketing_campaign_events(organization_id);