-- Clean up remaining placeholder maintenance data
DELETE FROM maintenance_notification_schedules WHERE maintenance_record_id = 'd2d42ae2-1603-451b-b1c5-aba4c691e07c';

-- Remove the remaining placeholder maintenance record
DELETE FROM maintenance_records WHERE id = 'd2d42ae2-1603-451b-b1c5-aba4c691e07c';