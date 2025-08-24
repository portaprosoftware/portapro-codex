-- Relax category restrictions to unblock service creation
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_category_check;