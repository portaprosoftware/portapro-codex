-- Add enhanced verification fields to decon_logs table
ALTER TABLE public.decon_logs 
ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS inspector_role TEXT,
ADD COLUMN IF NOT EXISTS verification_timestamp TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN public.decon_logs.follow_up_required IS 'Indicates if follow-up action is needed after decontamination';
COMMENT ON COLUMN public.decon_logs.inspector_role IS 'Role of the inspector who performed verification (owner, admin, dispatcher, driver, etc.)';
COMMENT ON COLUMN public.decon_logs.verification_timestamp IS 'Timestamp when the verification was completed';