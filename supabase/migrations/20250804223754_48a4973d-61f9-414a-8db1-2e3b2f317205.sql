-- First, let's see what job types currently exist and update the database structure to support surveys as a separate type

-- Check if we need to add survey as a job type constraint
-- For PostgreSQL, we need to update any enum constraints if they exist

-- Update existing survey jobs to be properly typed as 'on-site-survey' instead of 'service'
UPDATE jobs 
SET job_type = 'on-site-survey' 
WHERE job_number LIKE 'SURVEY-%';

-- If there's a check constraint or enum, we might need to modify it
-- Let's also ensure the job_type column can handle 'on-site-survey' values properly

-- Update any existing jobs that should be surveys based on job_number pattern
UPDATE jobs 
SET job_type = 'on-site-survey' 
WHERE job_number LIKE 'SURVEY-%' AND job_type = 'service';

-- Add an index for better performance on job_type filtering
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);

-- Make sure we have proper job numbering tracking for surveys
-- Add survey number tracking to company_settings if it doesn't exist
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS next_survey_number integer DEFAULT 1;

ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS survey_prefix text DEFAULT 'SURVEY';

-- Update the next_survey_number based on existing survey jobs
UPDATE company_settings 
SET next_survey_number = (
  SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM '\d+') AS INTEGER)), 0) + 1
  FROM jobs 
  WHERE job_number LIKE 'SURVEY-%'
)
WHERE next_survey_number IS NULL OR next_survey_number = 1;