-- Create compliance document types table
CREATE TABLE IF NOT EXISTS public.compliance_document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    default_reminder_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'compliance_document_types' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name = 'compliance_document_types_name_key'
    ) THEN
        ALTER TABLE public.compliance_document_types ADD CONSTRAINT compliance_document_types_name_key UNIQUE (name);
    END IF;
END $$;

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
DROP POLICY IF EXISTS "Allow authenticated users to upload compliance documents" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload compliance documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'compliance-documents');

DROP POLICY IF EXISTS "Allow authenticated users to view compliance documents" ON storage.objects;
CREATE POLICY "Allow authenticated users to view compliance documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'compliance-documents');

DROP POLICY IF EXISTS "Allow authenticated users to update compliance documents" ON storage.objects;
CREATE POLICY "Allow authenticated users to update compliance documents" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'compliance-documents');

-- Insert default document types with upsert logic
DO $$
DECLARE
    doc_types TEXT[] := ARRAY['Insurance', 'Registration', 'Inspection', 'Commercial License', 'DOT Permit', 'Emissions Certificate'];
    descriptions TEXT[] := ARRAY[
        'Vehicle insurance documentation',
        'Vehicle registration documents', 
        'Safety inspection certificates',
        'Commercial vehicle operating licenses',
        'Department of Transportation permits',
        'Environmental compliance certificates'
    ];
    reminder_days INTEGER[] := ARRAY[30, 30, 30, 60, 45, 90];
    i INTEGER;
BEGIN
    FOR i IN 1..array_length(doc_types, 1) LOOP
        INSERT INTO public.compliance_document_types (name, description, default_reminder_days)
        VALUES (doc_types[i], descriptions[i], reminder_days[i])
        ON CONFLICT (name) DO NOTHING;
    END LOOP;
END $$;

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

DROP POLICY IF EXISTS "Public access to compliance document types" ON public.compliance_document_types;
CREATE POLICY "Public access to compliance document types" 
ON public.compliance_document_types FOR ALL 
USING (true) 
WITH CHECK (true);

-- Update trigger for compliance_document_types
DROP TRIGGER IF EXISTS update_compliance_document_types_updated_at ON public.compliance_document_types;
CREATE TRIGGER update_compliance_document_types_updated_at
    BEFORE UPDATE ON public.compliance_document_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();