-- Add missing is_active column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Create index for better performance on products queries
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Create profiles table if it doesn't exist (for compliance stats)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  email text,
  phone text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create driver_training_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.driver_training_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id text NOT NULL,
  training_type text,
  last_completed timestamp with time zone,
  next_due timestamp with time zone,
  certificate_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);