-- Add new address fields to company_settings table
ALTER TABLE public.company_settings 
ADD COLUMN company_street TEXT,
ADD COLUMN company_street2 TEXT,
ADD COLUMN company_city TEXT,
ADD COLUMN company_state TEXT,
ADD COLUMN company_zipcode TEXT;