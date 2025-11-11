-- Create RPC function to safely increment opened_count
CREATE OR REPLACE FUNCTION increment_campaign_opened(campaign_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE marketing_campaigns
  SET opened_count = COALESCE(opened_count, 0) + 1
  WHERE id = campaign_id_param;
END;
$$;

-- Create RPC function to safely increment clicked_count
CREATE OR REPLACE FUNCTION increment_campaign_clicked(campaign_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE marketing_campaigns
  SET clicked_count = COALESCE(clicked_count, 0) + 1
  WHERE id = campaign_id_param;
END;
$$;