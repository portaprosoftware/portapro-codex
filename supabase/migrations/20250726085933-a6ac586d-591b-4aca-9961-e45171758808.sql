-- Create compliance document types table
CREATE TABLE IF NOT EXISTS public.compliance_document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    default_reminder_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add file storage columns to vehicle_compliance_documents
ALTER TABLE public.vehicle_compliance_documents 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS uploaded_by UUID;

-- Create storage bucket for compliance documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('compliance-documents', 'compliance-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for compliance documents
CREATE POLICY "Allow authenticated users to upload compliance documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'compliance-documents');

CREATE POLICY "Allow authenticated users to view compliance documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'compliance-documents');

CREATE POLICY "Allow authenticated users to update compliance documents" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'compliance-documents');

-- Insert default document types
INSERT INTO public.compliance_document_types (name, description, default_reminder_days) VALUES
('Insurance', 'Vehicle insurance documentation', 30),
('Registration', 'Vehicle registration documents', 30),
('Inspection', 'Safety inspection certificates', 30),
('Commercial License', 'Commercial vehicle operating licenses', 60),
('DOT Permit', 'Department of Transportation permits', 45),
('Emissions Certificate', 'Environmental compliance certificates', 90)
ON CONFLICT (name) DO NOTHING;

-- Create function to get compliance notification counts
CREATE OR REPLACE FUNCTION public.get_compliance_notification_counts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  overdue_count INTEGER := 0;
  critical_count INTEGER := 0;
  warning_count INTEGER := 0;
  result JSONB;
BEGIN
  -- Count overdue documents
  SELECT COUNT(*) INTO overdue_count
  FROM public.vehicle_compliance_documents
  WHERE expiration_date < CURRENT_DATE;
  
  -- Count critical documents (expiring within 7 days)
  SELECT COUNT(*) INTO critical_count
  FROM public.vehicle_compliance_documents
  WHERE expiration_date >= CURRENT_DATE 
    AND expiration_date <= CURRENT_DATE + INTERVAL '7 days';
  
  -- Count warning documents (expiring within 30 days but not critical)
  SELECT COUNT(*) INTO warning_count
  FROM public.vehicle_compliance_documents
  WHERE expiration_date > CURRENT_DATE + INTERVAL '7 days'
    AND expiration_date <= CURRENT_DATE + INTERVAL '30 days';
  
  result := jsonb_build_object(
    'overdue', overdue_count,
    'critical', critical_count,
    'warning', warning_count,
    'total', overdue_count + critical_count + warning_count
  );
  
  RETURN result;
END;
$$;

-- Add RLS to compliance_document_types
ALTER TABLE public.compliance_document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to compliance document types" 
ON public.compliance_document_types FOR ALL 
USING (true) 
WITH CHECK (true);

-- Update trigger for compliance_document_types
CREATE TRIGGER update_compliance_document_types_updated_at
    BEFORE UPDATE ON public.compliance_document_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();