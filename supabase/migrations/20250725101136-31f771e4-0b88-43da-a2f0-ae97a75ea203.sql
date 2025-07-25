-- Add primary key constraint to customers table
-- This will fix the ON CONFLICT specification error
ALTER TABLE public.customers 
ADD CONSTRAINT customers_pkey PRIMARY KEY (id);