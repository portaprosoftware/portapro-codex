-- Add customer contact fields to invoices table for auto-filling
ALTER TABLE public.invoices 
ADD COLUMN customer_name text,
ADD COLUMN customer_email text,
ADD COLUMN customer_phone text,
ADD COLUMN billing_address text,
ADD COLUMN service_address text;