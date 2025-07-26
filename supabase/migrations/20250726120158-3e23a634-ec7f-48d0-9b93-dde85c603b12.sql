-- Enhance vehicle_documents table for the new Documents & Media system
ALTER TABLE public.vehicle_documents 
ADD COLUMN upload_date timestamp with time zone DEFAULT now(),
ADD COLUMN category text DEFAULT 'other',
ADD COLUMN tags jsonb DEFAULT '[]'::jsonb,
ADD COLUMN linked_maintenance_record_id uuid REFERENCES public.maintenance_records(id);

-- Create document categories lookup table
CREATE TABLE public.document_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Insert default document categories
INSERT INTO public.document_categories (name, icon, color, description, display_order) VALUES
('receipt', 'Receipt', '#10B981', 'Maintenance receipts and invoices', 1),
('warranty', 'Shield', '#3B82F6', 'Product warranties and guarantees', 2),
('photo', 'Camera', '#8B5CF6', 'Job site photos and equipment images', 3),
('inspection', 'ClipboardCheck', '#F59E0B', 'Vehicle inspection reports', 4),
('registration', 'FileText', '#EF4444', 'Vehicle registration documents', 5),
('insurance', 'Shield', '#06B6D4', 'Insurance policies and claims', 6),
('other', 'File', '#6B7280', 'Miscellaneous documents', 7);

-- Enable RLS on document_categories
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for document_categories
CREATE POLICY "Public access to document categories" 
ON public.document_categories 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create storage bucket for vehicle documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-documents', 'vehicle-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for vehicle documents
CREATE POLICY "Allow public access to vehicle documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vehicle-documents');

CREATE POLICY "Allow users to upload vehicle documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'vehicle-documents');

CREATE POLICY "Allow users to update vehicle documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'vehicle-documents');

CREATE POLICY "Allow users to delete vehicle documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'vehicle-documents');