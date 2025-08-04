-- First, drop the existing check constraint that's blocking on-site-survey
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_job_type_check;

-- Create a new check constraint that includes on-site-survey as a valid job type
ALTER TABLE jobs ADD CONSTRAINT jobs_job_type_check 
CHECK (job_type IN ('delivery', 'pickup', 'service', 'cleaning', 'maintenance', 'on-site-survey', 'return', 'partial-pickup'));

-- Now update existing survey jobs to be properly typed as 'on-site-survey' instead of 'service'
UPDATE jobs 
SET job_type = 'on-site-survey' 
WHERE job_number LIKE 'SURVEY-%' AND job_type = 'service';

-- Add an index for better performance on job_type filtering
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);

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