-- Remove duplicate system document types, keeping only custom ones
-- This removes the predefined types that were copied during migration
-- and keeps only the ones users can edit/delete

DELETE FROM public.compliance_document_types 
WHERE name IN (
  'Annual DOT Inspection',
  'DOT/FMCSA DVIR Log', 
  'DOT Permit',
  'Emissions Certificate',
  'State Septage Hauler Permit',
  'WWTP Disposal Manifest',
  'Bloodborne Pathogens Training',
  'PPE Training Certificate',
  'Spill Kit Inspection Record',
  'SDS On Board',
  'Commercial License',
  'Registration',
  'Tank Leakproof Certification',
  'Insurance',
  'Inspection'
)
AND (description IS NULL OR description = '');