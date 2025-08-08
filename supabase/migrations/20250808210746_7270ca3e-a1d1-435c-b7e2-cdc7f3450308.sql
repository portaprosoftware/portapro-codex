-- Seed transport & spill compliance document types if missing
INSERT INTO public.compliance_document_types (name, description, default_reminder_days, is_active)
SELECT 'Annual DOT Inspection', 'Annual FMCSA-required vehicle inspection certificate', 365, true
WHERE NOT EXISTS (SELECT 1 FROM public.compliance_document_types WHERE name = 'Annual DOT Inspection');

INSERT INTO public.compliance_document_types (name, description, default_reminder_days, is_active)
SELECT 'DOT/FMCSA DVIR Log', 'Daily vehicle inspection report (pre/post-trip) record', 7, true
WHERE NOT EXISTS (SELECT 1 FROM public.compliance_document_types WHERE name = 'DOT/FMCSA DVIR Log');

INSERT INTO public.compliance_document_types (name, description, default_reminder_days, is_active)
SELECT 'State Septage Hauler Permit', 'State-issued septage vehicle/hauler permit with displayed number', 365, true
WHERE NOT EXISTS (SELECT 1 FROM public.compliance_document_types WHERE name = 'State Septage Hauler Permit');

INSERT INTO public.compliance_document_types (name, description, default_reminder_days, is_active)
SELECT 'Tank Leakproof Certification', 'Certification/inspection verifying tank and hose integrity (leakproof)', 365, true
WHERE NOT EXISTS (SELECT 1 FROM public.compliance_document_types WHERE name = 'Tank Leakproof Certification');

INSERT INTO public.compliance_document_types (name, description, default_reminder_days, is_active)
SELECT 'Spill Kit Inspection Record', 'Verification that vehicle spill kit is present and complete', 30, true
WHERE NOT EXISTS (SELECT 1 FROM public.compliance_document_types WHERE name = 'Spill Kit Inspection Record');

INSERT INTO public.compliance_document_types (name, description, default_reminder_days, is_active)
SELECT 'PPE Training Certificate', 'Evidence of driver PPE training (gloves, eye/face, etc.)', 365, true
WHERE NOT EXISTS (SELECT 1 FROM public.compliance_document_types WHERE name = 'PPE Training Certificate');

INSERT INTO public.compliance_document_types (name, description, default_reminder_days, is_active)
SELECT 'Bloodborne Pathogens Training', 'OSHA 1910.1030 training documentation for exposure control', 365, true
WHERE NOT EXISTS (SELECT 1 FROM public.compliance_document_types WHERE name = 'Bloodborne Pathogens Training');

INSERT INTO public.compliance_document_types (name, description, default_reminder_days, is_active)
SELECT 'WWTP Disposal Manifest', 'Receipt/manifest for disposal at wastewater treatment plant', 0, true
WHERE NOT EXISTS (SELECT 1 FROM public.compliance_document_types WHERE name = 'WWTP Disposal Manifest');

INSERT INTO public.compliance_document_types (name, description, default_reminder_days, is_active)
SELECT 'SDS On Board', 'Safety Data Sheets for chemicals carried with the vehicle', 365, true
WHERE NOT EXISTS (SELECT 1 FROM public.compliance_document_types WHERE name = 'SDS On Board');