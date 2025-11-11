-- Create marketing_templates table for email/campaign templates
CREATE TABLE IF NOT EXISTS marketing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  preview_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for organization_id for faster queries
CREATE INDEX IF NOT EXISTS idx_marketing_templates_org_id 
  ON marketing_templates(organization_id);

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketing_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_marketing_templates_updated_at
  BEFORE UPDATE ON marketing_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_templates_updated_at();