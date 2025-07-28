-- Add missing foreign key constraint for quotes table
ALTER TABLE public.quotes 
ADD CONSTRAINT quotes_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id);

-- Also check and add foreign key for active_quotes if needed
-- (active_quotes appears to be a view, so we might need to check its underlying structure)