-- Remove default_reminder_days column from compliance_document_types table as it's not being used
ALTER TABLE public.compliance_document_types DROP COLUMN IF EXISTS default_reminder_days;