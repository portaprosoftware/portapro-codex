
-- Create QR feedback table for customer feedback from QR scans
CREATE TABLE IF NOT EXISTS public.qr_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.product_items(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('assistance', 'comment')),
  customer_message TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  photo_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for QR feedback
ALTER TABLE public.qr_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to QR feedback" 
  ON public.qr_feedback 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION public.update_qr_feedback_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE TRIGGER update_qr_feedback_updated_at
    BEFORE UPDATE ON public.qr_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.update_qr_feedback_updated_at();

-- Add QR feedback to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE qr_feedback;

-- Set replica identity for realtime updates
ALTER TABLE public.qr_feedback REPLICA IDENTITY FULL;

-- Add company settings for QR feedback configuration
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS qr_feedback_email TEXT DEFAULT 'support@company.com',
ADD COLUMN IF NOT EXISTS qr_feedback_notifications_enabled BOOLEAN DEFAULT true;
