-- Add parent_group column to document_categories
ALTER TABLE public.document_categories
ADD COLUMN IF NOT EXISTS parent_group TEXT;

-- Update existing categories with their parent groups
UPDATE public.document_categories
SET parent_group = 'maintenance'
WHERE name IN ('Maintenance & Repairs', 'Fuel Receipts', 'Inspection Reports', 'Service Records', 'Work Orders');

UPDATE public.document_categories
SET parent_group = 'compliance'
WHERE name IN ('Registration', 'Title / Ownership', 'Insurance', 'Emissions & Inspection Certificates', 'Permits & Licensing');

UPDATE public.document_categories
SET parent_group = 'personnel'
WHERE name IN ('Driver License & ID', 'Training Certificates', 'Accident / Incident Reports', 'Disciplinary / Safety Records');

UPDATE public.document_categories
SET parent_group = 'equipment'
WHERE name IN ('Equipment Manuals', 'Warranty Documents', 'Purchase / Lease Agreements', 'Upfit / Modification Docs');

UPDATE public.document_categories
SET parent_group = 'photos'
WHERE name IN ('Vehicle Photos', 'Job Site Photos', 'Compliance Photos');

UPDATE public.document_categories
SET parent_group = 'financial'
WHERE name IN ('Invoices & Receipts', 'Purchase Orders', 'Tax Documents', 'Contracts & Agreements');

UPDATE public.document_categories
SET parent_group = 'other'
WHERE name IN ('Other Documents', 'Temporary / Draft Files');