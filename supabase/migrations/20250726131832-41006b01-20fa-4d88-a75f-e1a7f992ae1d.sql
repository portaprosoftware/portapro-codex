-- Create template sections table for drag-and-drop sections
CREATE TABLE public.template_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL,
  section_type TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create section types master table
CREATE TABLE public.section_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  default_settings JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add page settings to templates table (only if columns don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_report_templates' AND column_name = 'page_size') THEN
    ALTER TABLE public.maintenance_report_templates 
    ADD COLUMN page_size TEXT DEFAULT 'letter',
    ADD COLUMN orientation TEXT DEFAULT 'portrait',
    ADD COLUMN company_logo_url TEXT,
    ADD COLUMN color_accent TEXT DEFAULT '#3B82F6',
    ADD COLUMN version INTEGER DEFAULT 1,
    ADD COLUMN parent_template_id UUID,
    ADD COLUMN category TEXT DEFAULT 'general';
  END IF;
END $$;

-- Create indexes
CREATE INDEX idx_template_sections_template_id ON public.template_sections(template_id);
CREATE INDEX idx_template_sections_position ON public.template_sections(template_id, position);

-- Create update triggers
CREATE TRIGGER update_template_sections_updated_at
  BEFORE UPDATE ON public.template_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default section types
INSERT INTO public.section_types (name, display_name, category, icon, description, default_settings) VALUES
('header', 'Header', 'Layout', 'FileText', 'Company logo, name, and report title', '{"showLogo": true, "showDate": true, "fontSize": "large"}'),
('footer', 'Footer', 'Layout', 'FileText', 'Page numbers and terms', '{"showPageNumbers": true, "showTerms": false}'),
('customer_info', 'Customer Information', 'Client & Job', 'Users', 'Customer name, contact details, and service address', '{"showContact": true, "showAddress": true}'),
('job_details', 'Job Details', 'Client & Job', 'Clipboard', 'Report number, date, and technician assigned', '{"showReportNumber": true, "showDate": true, "showTechnician": true}'),
('vehicle_info', 'Vehicle Information', 'Vehicle', 'Truck', 'License plate, VIN, make/model details', '{"showVIN": true, "showMakeModel": true, "showSerial": false}'),
('service_checklist', 'Service Checklist', 'Service Details', 'CheckSquare', 'Dynamic list of tasks performed', '{"allowCustomItems": true, "showCheckboxes": true}'),
('parts_used', 'Parts Used', 'Service Details', 'Package', 'Table of parts with quantities and costs', '{"showCosts": true, "allowCustomParts": true, "columns": ["name", "sku", "quantity", "unitCost", "total"]}'),
('labor_summary', 'Labor Summary', 'Service Details', 'Clock', 'Hours worked and labor costs', '{"showHourlyRate": true, "allowMultipleEntries": false}'),
('photos', 'Photos & Attachments', 'Media', 'Camera', 'Inline photo thumbnails', '{"maxPhotos": 10, "showThumbnails": true, "allowEnlarge": true}'),
('technician_signature', 'Technician Signature', 'Signatures', 'PenTool', 'Technician signature and date', '{"required": true, "showDate": true}'),
('customer_signature', 'Customer Signature', 'Signatures', 'PenTool', 'Customer approval signature', '{"required": false, "showDate": true}'),
('notes', 'Additional Notes', 'Content', 'FileText', 'Free-form text area for additional information', '{"placeholder": "Additional notes or comments...", "height": "medium"}');