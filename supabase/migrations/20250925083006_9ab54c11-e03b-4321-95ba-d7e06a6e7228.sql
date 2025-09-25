-- Update existing document types to assign them to appropriate categories
-- This ensures all existing document types have proper category assignments

UPDATE public.compliance_document_types 
SET category = 'compliance-regulatory'
WHERE name IN (
  'Annual DOT Inspection',
  'DOT/FMCSA DVIR Log', 
  'DOT Permit',
  'Emissions Certificate',
  'State Septage Hauler Permit',
  'WWTP Disposal Manifest'
);

UPDATE public.compliance_document_types 
SET category = 'safety-training'
WHERE name IN (
  'Bloodborne Pathogens Training',
  'PPE Training Certificate',
  'Spill Kit Inspection Record',
  'SDS On Board'
);

UPDATE public.compliance_document_types 
SET category = 'licensing-registration'
WHERE name IN (
  'Commercial License',
  'Registration',
  'Tank Leakproof Certification'
);

UPDATE public.compliance_document_types 
SET category = 'insurance-inspection'
WHERE name IN (
  'Insurance',
  'Inspection'
);

-- Set default category for any remaining unassigned types
UPDATE public.compliance_document_types 
SET category = 'compliance-regulatory'
WHERE category IS NULL;