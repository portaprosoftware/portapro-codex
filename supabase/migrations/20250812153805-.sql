-- Create driver_documents table
CREATE TABLE public.driver_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES driver_credentials(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  file_url TEXT,
  issue_date DATE,
  expiry_date DATE,
  notes TEXT,
  uploaded_by UUID,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_driver_documents_driver_id ON public.driver_documents(driver_id);
CREATE INDEX idx_driver_documents_document_type ON public.driver_documents(document_type);
CREATE INDEX idx_driver_documents_expiry_date ON public.driver_documents(expiry_date);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_driver_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_driver_documents_updated_at
  BEFORE UPDATE ON public.driver_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_documents_updated_at();