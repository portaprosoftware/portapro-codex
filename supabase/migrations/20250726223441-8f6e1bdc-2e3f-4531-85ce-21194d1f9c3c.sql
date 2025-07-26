-- Add columns to support partial pickups with quantity and notes
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS partial_pickups jsonb DEFAULT '[]'::jsonb;

-- Update the job type enum to remove 'partial-pickup' as standalone type
-- Note: This will be validated in application code instead of database constraints

-- Add a table to track pickup events for better organization
CREATE TABLE IF NOT EXISTS job_pickup_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  pickup_type text NOT NULL CHECK (pickup_type IN ('partial', 'final')),
  scheduled_date date NOT NULL,
  scheduled_time text,
  quantity integer DEFAULT 1,
  notes text,
  sequence_order integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE job_pickup_events ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for public access (following the pattern of other tables)
CREATE POLICY "Public access to job pickup events"
ON job_pickup_events
FOR ALL
USING (true)
WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_pickup_events_job_id ON job_pickup_events(job_id);
CREATE INDEX IF NOT EXISTS idx_job_pickup_events_scheduled_date ON job_pickup_events(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_job_pickup_events_sequence ON job_pickup_events(job_id, sequence_order);