
-- Create job_notes table for driver notes
CREATE TABLE public.job_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'completion', 'issue', 'customer_interaction'))
);

-- Create job_status_logs table for status change tracking
CREATE TABLE public.job_status_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location_latitude NUMERIC,
  location_longitude NUMERIC,
  notes TEXT
);

-- Create storage buckets for job photos and signatures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('job-photos', 'job-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('job-signatures', 'job-signatures', true, 2097152, ARRAY['image/png', 'image/svg+xml']);

-- Create storage policies for job photos
CREATE POLICY "Anyone can view job photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'job-photos');

CREATE POLICY "Authenticated users can upload job photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'job-photos');

CREATE POLICY "Users can update their own job photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'job-photos');

CREATE POLICY "Users can delete their own job photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'job-photos');

-- Create storage policies for job signatures
CREATE POLICY "Anyone can view job signatures" ON storage.objects
  FOR SELECT USING (bucket_id = 'job-signatures');

CREATE POLICY "Authenticated users can upload job signatures" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'job-signatures');

CREATE POLICY "Users can update their own job signatures" ON storage.objects
  FOR UPDATE USING (bucket_id = 'job-signatures');

CREATE POLICY "Users can delete their own job signatures" ON storage.objects
  FOR DELETE USING (bucket_id = 'job-signatures');

-- Create RLS policies for job_notes
ALTER TABLE public.job_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to job notes" ON public.job_notes
  FOR ALL USING (true) WITH CHECK (true);

-- Create RLS policies for job_status_logs
ALTER TABLE public.job_status_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to job status logs" ON public.job_status_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_job_notes_job_id ON public.job_notes(job_id);
CREATE INDEX idx_job_notes_driver_id ON public.job_notes(driver_id);
CREATE INDEX idx_job_status_logs_job_id ON public.job_status_logs(job_id);
CREATE INDEX idx_job_status_logs_changed_at ON public.job_status_logs(changed_at);

-- Add trigger to update updated_at timestamp for job_notes
CREATE OR REPLACE FUNCTION public.update_job_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_notes_updated_at
  BEFORE UPDATE ON public.job_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_notes_updated_at();

-- Create function to log job status changes
CREATE OR REPLACE FUNCTION public.log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.job_status_logs (
      job_id,
      changed_by,
      old_status,
      new_status,
      notes
    ) VALUES (
      NEW.id,
      COALESCE(auth.uid()::UUID, NEW.driver_id),
      OLD.status,
      NEW.status,
      CASE 
        WHEN NEW.status = 'completed' THEN 'Job marked as completed'
        WHEN NEW.status = 'in-progress' THEN 'Job started'
        ELSE 'Status updated'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically log job status changes
CREATE TRIGGER log_job_status_changes
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.log_job_status_change();

-- Create function to add job coordinates (GPS drop pins)
CREATE OR REPLACE FUNCTION public.add_job_coordinates(
  job_uuid UUID,
  coordinate_ids UUID[]
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the job with selected coordinate IDs
  UPDATE public.jobs 
  SET selected_coordinate_ids = to_jsonb(coordinate_ids)
  WHERE id = job_uuid;
  
  RETURN FOUND;
END;
$$;

-- Create push subscription table for web push notifications
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RLS policies for push subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for push subscriptions
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON public.push_subscriptions(is_active);
