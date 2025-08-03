-- Phase 1: Remove complex padlock system tables and columns
DROP TABLE IF EXISTS public.padlock_activity_log CASCADE;
DROP TABLE IF EXISTS public.padlock_security_incidents CASCADE;
DROP TABLE IF EXISTS public.maintenance_notification_schedules CASCADE;

-- Remove padlock-related columns from product_items
ALTER TABLE public.product_items 
DROP COLUMN IF EXISTS currently_padlocked,
DROP COLUMN IF EXISTS padlock_type,
DROP COLUMN IF EXISTS padlock_code_reference,
DROP COLUMN IF EXISTS last_padlock_timestamp,
DROP COLUMN IF EXISTS last_unlock_timestamp,
DROP COLUMN IF EXISTS padlocked_by,
DROP COLUMN IF EXISTS unlocked_by,
DROP COLUMN IF EXISTS supports_padlock;

-- Phase 2: Add simple lock fields
-- Add simple lock field to products
ALTER TABLE public.products 
ADD COLUMN includes_lock boolean DEFAULT false;

-- Add simple lock fields to jobs
ALTER TABLE public.jobs 
ADD COLUMN locks_requested boolean DEFAULT false,
ADD COLUMN lock_notes text,
ADD COLUMN zip_tied_on_dropoff boolean DEFAULT false;