-- Phase 4: File uploads for incident photos
-- Create storage bucket for incident photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('incident-photos', 'incident-photos', false);

-- Create RLS policies for incident photos bucket
CREATE POLICY "Allow authenticated users to upload incident photos" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'incident-photos');

CREATE POLICY "Allow authenticated users to view incident photos" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'incident-photos');

CREATE POLICY "Allow authenticated users to update incident photos" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'incident-photos');

CREATE POLICY "Allow authenticated users to delete incident photos" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'incident-photos');

-- Phase 5: Notification system
-- Create incident notification settings table
CREATE TABLE public.incident_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  sms_notifications BOOLEAN NOT NULL DEFAULT false,
  notification_recipients TEXT[] NOT NULL DEFAULT '{}',
  severity_threshold TEXT NOT NULL DEFAULT 'moderate',
  immediate_notification_for_reportable BOOLEAN NOT NULL DEFAULT true,
  business_hours_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default notification settings
INSERT INTO public.incident_notification_settings (
  email_notifications,
  notification_recipients,
  severity_threshold
) VALUES (
  true,
  ARRAY['safety@company.com'],
  'moderate'
);

-- Create trigger for updated_at
CREATE TRIGGER update_incident_notification_settings_updated_at
  BEFORE UPDATE ON public.incident_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create incident notification log table
CREATE TABLE public.incident_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.spill_incident_reports(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms', 'webhook')),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX idx_incident_notification_logs_incident_id ON public.incident_notification_logs(incident_id);
CREATE INDEX idx_incident_notification_logs_sent_at ON public.incident_notification_logs(sent_at);

-- Phase 6: Advanced reporting
-- Create incident analytics view
CREATE OR REPLACE VIEW public.incident_analytics AS
SELECT 
  DATE_TRUNC('month', created_at) as period,
  COUNT(*) as total_incidents,
  COUNT(*) FILTER (WHERE severity = 'minor') as minor_incidents,
  COUNT(*) FILTER (WHERE severity = 'moderate') as moderate_incidents,
  COUNT(*) FILTER (WHERE severity = 'major') as major_incidents,
  COUNT(*) FILTER (WHERE severity = 'reportable') as reportable_incidents,
  COUNT(*) FILTER (WHERE regulatory_notification_required = true) as regulatory_required,
  COUNT(*) FILTER (WHERE status = 'open') as open_incidents,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_incidents,
  AVG(CASE WHEN status = 'closed' AND updated_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600 
    ELSE NULL END) as avg_resolution_hours
FROM public.spill_incident_reports
WHERE created_at >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY period DESC;

-- Create incident export function
CREATE OR REPLACE FUNCTION public.export_incident_data(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  severity_filter TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  incident_id UUID,
  created_date DATE,
  spill_type TEXT,
  severity TEXT,
  status TEXT,
  location_description TEXT,
  cause_description TEXT,
  volume_estimate NUMERIC,
  volume_unit TEXT,
  responsible_party TEXT,
  regulatory_required BOOLEAN,
  regulatory_sent BOOLEAN,
  vehicle_license_plate TEXT,
  photo_count BIGINT,
  witness_count BIGINT,
  cleanup_action_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sir.id,
    sir.created_at::DATE,
    sir.spill_type,
    sir.severity::TEXT,
    sir.status,
    sir.location_description,
    sir.cause_description,
    sir.volume_estimate,
    sir.volume_unit,
    sir.responsible_party,
    sir.regulatory_notification_required,
    sir.regulatory_notification_sent,
    v.license_plate,
    COALESCE(photo_counts.photo_count, 0),
    COALESCE(witness_counts.witness_count, 0),
    COALESCE(array_length(sir.cleanup_actions, 1), 0)
  FROM public.spill_incident_reports sir
  LEFT JOIN public.vehicles v ON v.id = sir.vehicle_id
  LEFT JOIN (
    SELECT incident_id, COUNT(*) as photo_count 
    FROM public.incident_photos 
    GROUP BY incident_id
  ) photo_counts ON photo_counts.incident_id = sir.id
  LEFT JOIN (
    SELECT incident_id, COUNT(*) as witness_count 
    FROM public.incident_witnesses 
    GROUP BY incident_id
  ) witness_counts ON witness_counts.incident_id = sir.id
  WHERE 
    (start_date IS NULL OR sir.created_at::DATE >= start_date)
    AND (end_date IS NULL OR sir.created_at::DATE <= end_date)
    AND (severity_filter IS NULL OR sir.severity::TEXT = severity_filter)
    AND (status_filter IS NULL OR sir.status = status_filter)
  ORDER BY sir.created_at DESC;
END;
$$;