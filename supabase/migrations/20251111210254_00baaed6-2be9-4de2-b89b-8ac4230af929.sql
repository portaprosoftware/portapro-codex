-- Create marketing_campaign_events table for tracking campaign engagement
CREATE TABLE IF NOT EXISTS marketing_campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  event_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign_id ON marketing_campaign_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_events_organization_id ON marketing_campaign_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_events_type ON marketing_campaign_events(event_type);
CREATE INDEX IF NOT EXISTS idx_campaign_events_created_at ON marketing_campaign_events(created_at DESC);

-- Add delivered_count, opened_count, clicked_count columns to marketing_campaigns if they don't exist
ALTER TABLE marketing_campaigns 
  ADD COLUMN IF NOT EXISTS delivered_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opened_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicked_count INTEGER DEFAULT 0;