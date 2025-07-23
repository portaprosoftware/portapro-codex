-- Add important_information field to customers table
ALTER TABLE public.customers 
ADD COLUMN important_information TEXT;