-- Phase 1: Remove SMS Infrastructure
-- Drop all SMS-related columns from notification_preferences table

ALTER TABLE public.notification_preferences
DROP COLUMN IF EXISTS job_status_change_sms,
DROP COLUMN IF EXISTS new_job_assigned_sms,
DROP COLUMN IF EXISTS route_schedule_changes_sms,
DROP COLUMN IF EXISTS maintenance_sms_7_day,
DROP COLUMN IF EXISTS maintenance_sms_day_of,
DROP COLUMN IF EXISTS maintenance_mileage_sms,
DROP COLUMN IF EXISTS quote_invoice_sms,
DROP COLUMN IF EXISTS invoice_reminders_sms,
DROP COLUMN IF EXISTS payment_confirmations_sms,
DROP COLUMN IF EXISTS low_stock_alerts_sms,
DROP COLUMN IF EXISTS asset_movement_sms,
DROP COLUMN IF EXISTS vehicle_status_changes_sms,
DROP COLUMN IF EXISTS driver_check_ins_sms,
DROP COLUMN IF EXISTS new_team_members_sms,
DROP COLUMN IF EXISTS comment_mentions_sms,
DROP COLUMN IF EXISTS overdue_job_sms,
DROP COLUMN IF EXISTS phone_number;