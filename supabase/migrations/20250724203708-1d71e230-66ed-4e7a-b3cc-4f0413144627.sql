-- Add billing address toggle and deposit requirement fields to customers table
ALTER TABLE public.customers 
ADD COLUMN billing_differs_from_service boolean NOT NULL DEFAULT false,
ADD COLUMN deposit_required boolean NOT NULL DEFAULT true;