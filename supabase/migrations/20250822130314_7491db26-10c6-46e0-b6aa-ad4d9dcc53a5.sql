-- Add tax_rate_override field to customers table
ALTER TABLE public.customers 
ADD COLUMN tax_rate_override numeric DEFAULT NULL;

COMMENT ON COLUMN public.customers.tax_rate_override IS 'Optional tax rate override for this customer (decimal format, e.g. 0.08 for 8%)';