-- Fix missing foreign key relationships

-- Add missing tables first
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  email text,
  phone text,
  service_street text,
  service_street2 text,
  service_city text,
  service_state text,
  service_zip text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_plate text NOT NULL,
  vehicle_type text NOT NULL,
  make text,
  model text,
  year integer,
  status text DEFAULT 'active',
  last_known_location point,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.maintenance_task_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compliance_document_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehicle_compliance_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid,
  document_type_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_vehicle_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid,
  driver_id text,
  assignment_date date,
  start_mileage integer,
  end_mileage integer,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid,
  invoice_number text,
  amount numeric,
  status text DEFAULT 'unpaid',
  created_at timestamp with time zone DEFAULT now()
);

-- Add foreign key constraints for jobs table
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_vehicle_id_fkey 
FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);

-- Add foreign key constraints for maintenance_records table
ALTER TABLE public.maintenance_records 
ADD CONSTRAINT maintenance_records_vehicle_id_fkey 
FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);

ALTER TABLE public.maintenance_records 
ADD CONSTRAINT maintenance_records_task_type_id_fkey 
FOREIGN KEY (task_type_id) REFERENCES public.maintenance_task_types(id);

ALTER TABLE public.maintenance_records 
ADD CONSTRAINT maintenance_records_vendor_id_fkey 
FOREIGN KEY (vendor_id) REFERENCES public.maintenance_vendors(id);

-- Add foreign key constraints for fuel_logs table
ALTER TABLE public.fuel_logs 
ADD CONSTRAINT fuel_logs_vehicle_id_fkey 
FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);

ALTER TABLE public.fuel_logs 
ADD CONSTRAINT fuel_logs_driver_id_fkey 
FOREIGN KEY (driver_id) REFERENCES public.profiles(id);

-- Add foreign key constraints for daily_vehicle_assignments table
ALTER TABLE public.daily_vehicle_assignments 
ADD CONSTRAINT daily_vehicle_assignments_vehicle_id_fkey 
FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);

ALTER TABLE public.daily_vehicle_assignments 
ADD CONSTRAINT daily_vehicle_assignments_driver_id_fkey 
FOREIGN KEY (driver_id) REFERENCES public.profiles(id);

-- Add foreign key constraints for vehicle_compliance_documents table
ALTER TABLE public.vehicle_compliance_documents 
ADD CONSTRAINT vehicle_compliance_documents_vehicle_id_fkey 
FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);

ALTER TABLE public.vehicle_compliance_documents 
ADD CONSTRAINT vehicle_compliance_documents_document_type_id_fkey 
FOREIGN KEY (document_type_id) REFERENCES public.compliance_document_types(id);

-- Add foreign key constraints for invoices table
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id);

-- Add foreign key constraints for consumable_location_stock table
ALTER TABLE public.consumable_location_stock 
ADD CONSTRAINT consumable_location_stock_consumable_id_fkey 
FOREIGN KEY (consumable_id) REFERENCES public.consumables(id);

ALTER TABLE public.consumable_location_stock 
ADD CONSTRAINT consumable_location_stock_storage_location_id_fkey 
FOREIGN KEY (storage_location_id) REFERENCES public.storage_locations(id);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create public access policies for all tables
CREATE POLICY "Public access" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.maintenance_task_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.compliance_document_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.vehicle_compliance_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.daily_vehicle_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON public.invoices FOR ALL USING (true) WITH CHECK (true);