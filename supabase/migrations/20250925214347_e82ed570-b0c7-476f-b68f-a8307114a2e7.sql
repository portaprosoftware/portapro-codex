-- Check if daily_rate column exists in maintenance_vendors table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'maintenance_vendors' 
  AND table_schema = 'public'
  AND column_name IN ('hourly_rate', 'daily_rate');