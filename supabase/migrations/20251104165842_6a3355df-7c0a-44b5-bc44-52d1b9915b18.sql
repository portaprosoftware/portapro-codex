-- Add push notification columns to notification_preferences table
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS job_assignments_push BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS route_schedule_changes_push BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS maintenance_alerts_push BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quote_updates_push BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS invoice_reminders_push BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_confirmations_push BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS low_stock_alerts_push BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS asset_movement_push BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vehicle_status_changes_push BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS driver_check_ins_push BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS new_team_members_push BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS comment_mentions_push BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS overdue_job_push BOOLEAN DEFAULT false;