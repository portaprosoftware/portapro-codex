-- Add email column to notification_preferences table
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS email TEXT;