-- Add rental_duration_days to jobs table for consistent date calculations
ALTER TABLE jobs ADD COLUMN rental_duration_days INTEGER;