-- Add new notification preference columns for customer-facing operations

-- Jobs & Operations
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS route_schedule_changes_email BOOLEAN DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS route_schedule_changes_sms BOOLEAN DEFAULT false;

-- Financial (invoice_reminders and quote_updates)
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS invoice_reminders_email BOOLEAN DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS invoice_reminders_sms BOOLEAN DEFAULT false;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS payment_confirmations_email BOOLEAN DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS payment_confirmations_sms BOOLEAN DEFAULT false;

-- Inventory & Fleet
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS low_stock_alerts_email BOOLEAN DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS low_stock_alerts_sms BOOLEAN DEFAULT false;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS asset_movement_email BOOLEAN DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS asset_movement_sms BOOLEAN DEFAULT false;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS vehicle_status_changes_email BOOLEAN DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS vehicle_status_changes_sms BOOLEAN DEFAULT false;

-- Team & Communication
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS driver_check_ins_email BOOLEAN DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS driver_check_ins_sms BOOLEAN DEFAULT false;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS new_team_members_email BOOLEAN DEFAULT false;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS new_team_members_sms BOOLEAN DEFAULT false;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS comment_mentions_email BOOLEAN DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS comment_mentions_sms BOOLEAN DEFAULT false;