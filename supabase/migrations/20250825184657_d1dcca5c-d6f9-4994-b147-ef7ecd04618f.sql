-- Add title field to customer_notes table
ALTER TABLE public.customer_notes 
ADD COLUMN title text;

-- Set a default title for existing notes to avoid null values
UPDATE public.customer_notes 
SET title = 'Customer Note' 
WHERE title IS NULL;