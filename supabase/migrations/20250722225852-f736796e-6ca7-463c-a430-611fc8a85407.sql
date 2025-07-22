
-- Create customer segments table for smart segments
CREATE TABLE public.customer_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  segment_type TEXT NOT NULL DEFAULT 'smart',
  rule_set JSONB NOT NULL DEFAULT '{}',
  customer_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create marketing campaigns table
CREATE TABLE public.marketing_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- 'email', 'sms', 'both'
  template_id UUID REFERENCES public.communication_templates(id),
  target_segments JSONB DEFAULT '[]',
  target_customer_types JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'completed'
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create campaign analytics table
CREATE TABLE public.campaign_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced'
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

-- Public access policies
CREATE POLICY "Public access to customer segments" ON public.customer_segments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to marketing campaigns" ON public.marketing_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to campaign analytics" ON public.campaign_analytics FOR ALL USING (true) WITH CHECK (true);

-- Function to get customer type counts with communication preferences
CREATE OR REPLACE FUNCTION public.get_customer_type_counts()
RETURNS TABLE(
  customer_type TEXT,
  total_count BIGINT,
  email_count BIGINT,
  sms_count BIGINT,
  both_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.type::text as customer_type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE c.email IS NOT NULL AND c.email != '' AND (c.phone IS NULL OR c.phone = '')) as email_count,
    COUNT(*) FILTER (WHERE c.phone IS NOT NULL AND c.phone != '' AND (c.email IS NULL OR c.email = '')) as sms_count,
    COUNT(*) FILTER (WHERE c.email IS NOT NULL AND c.email != '' AND c.phone IS NOT NULL AND c.phone != '') as both_count
  FROM public.customers c
  WHERE c.type IS NOT NULL
  GROUP BY c.type;
END;
$$;

-- Function to update segment customer counts
CREATE OR REPLACE FUNCTION public.update_segment_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- This is a placeholder for dynamic segment counting logic
  -- In practice, you would implement rule evaluation here
  RETURN NEW;
END;
$$;

-- Trigger to automatically update segment counts when customers change
CREATE TRIGGER update_segment_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_segment_counts();

-- Add updated_at trigger for marketing tables
CREATE TRIGGER update_customer_segments_updated_at
  BEFORE UPDATE ON public.customer_segments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
