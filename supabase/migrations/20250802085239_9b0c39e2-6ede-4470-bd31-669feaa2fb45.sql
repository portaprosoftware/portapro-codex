-- Create scheduled reports table
CREATE TABLE public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preset_id UUID REFERENCES public.filter_presets(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly')),
  schedule_config JSONB NOT NULL DEFAULT '{}',
  email_recipients TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report executions log table
CREATE TABLE public.report_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_report_id UUID NOT NULL REFERENCES public.scheduled_reports(id) ON DELETE CASCADE,
  execution_status TEXT NOT NULL CHECK (execution_status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  results_count INTEGER,
  error_message TEXT,
  report_data JSONB,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create filter recommendations table
CREATE TABLE public.filter_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  recommended_filters JSONB NOT NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('frequent_combination', 'trending', 'suggested_addition')),
  confidence_score NUMERIC NOT NULL DEFAULT 0.0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create triggers for updated_at
CREATE TRIGGER update_scheduled_reports_updated_at
  BEFORE UPDATE ON public.scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_filter_presets_updated_at();

CREATE TRIGGER update_filter_recommendations_updated_at
  BEFORE UPDATE ON public.filter_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_filter_presets_updated_at();

-- Create function to calculate next run time
CREATE OR REPLACE FUNCTION public.calculate_next_run_time(schedule_type TEXT, schedule_config JSONB)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
  next_run TIMESTAMP WITH TIME ZONE;
  hour_of_day INTEGER;
  day_of_week INTEGER;
  day_of_month INTEGER;
BEGIN
  hour_of_day := COALESCE((schedule_config->>'hour')::INTEGER, 8); -- Default 8 AM
  
  CASE schedule_type
    WHEN 'daily' THEN
      next_run := date_trunc('day', now()) + INTERVAL '1 day' + (hour_of_day || ' hours')::INTERVAL;
    WHEN 'weekly' THEN
      day_of_week := COALESCE((schedule_config->>'day_of_week')::INTEGER, 1); -- Default Monday
      next_run := date_trunc('week', now()) + INTERVAL '1 week' + (day_of_week || ' days')::INTERVAL + (hour_of_day || ' hours')::INTERVAL;
    WHEN 'monthly' THEN
      day_of_month := COALESCE((schedule_config->>'day_of_month')::INTEGER, 1); -- Default 1st of month
      next_run := date_trunc('month', now()) + INTERVAL '1 month' + ((day_of_month - 1) || ' days')::INTERVAL + (hour_of_day || ' hours')::INTERVAL;
  END CASE;
  
  -- If the calculated time is in the past, add another interval
  IF next_run <= now() THEN
    CASE schedule_type
      WHEN 'daily' THEN
        next_run := next_run + INTERVAL '1 day';
      WHEN 'weekly' THEN
        next_run := next_run + INTERVAL '1 week';
      WHEN 'monthly' THEN
        next_run := next_run + INTERVAL '1 month';
    END CASE;
  END IF;
  
  RETURN next_run;
END;
$$;

-- Create function to generate filter recommendations
CREATE OR REPLACE FUNCTION public.generate_filter_recommendations(target_user_id TEXT)
RETURNS TABLE(filters JSONB, type TEXT, confidence NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_usage RECORD;
  common_combo RECORD;
BEGIN
  -- Find frequent filter combinations for this user
  FOR user_usage IN
    SELECT 
      fp.filter_data,
      COUNT(fpu.id) as usage_count
    FROM public.filter_presets fp
    JOIN public.filter_preset_usage fpu ON fp.id = fpu.preset_id
    WHERE fpu.user_id = target_user_id
    GROUP BY fp.filter_data
    HAVING COUNT(fpu.id) >= 3
    ORDER BY usage_count DESC
    LIMIT 5
  LOOP
    RETURN QUERY SELECT 
      user_usage.filter_data,
      'frequent_combination'::TEXT,
      (user_usage.usage_count::NUMERIC / 10.0)::NUMERIC;
  END LOOP;
  
  -- Find trending combinations across all users
  FOR common_combo IN
    SELECT 
      fp.filter_data,
      COUNT(DISTINCT fpu.user_id) as user_count,
      COUNT(fpu.id) as total_usage
    FROM public.filter_presets fp
    JOIN public.filter_preset_usage fpu ON fp.id = fpu.preset_id
    WHERE fpu.used_at >= now() - INTERVAL '30 days'
    GROUP BY fp.filter_data
    HAVING COUNT(DISTINCT fpu.user_id) >= 2
    ORDER BY total_usage DESC
    LIMIT 3
  LOOP
    RETURN QUERY SELECT 
      common_combo.filter_data,
      'trending'::TEXT,
      (common_combo.user_count::NUMERIC / 5.0)::NUMERIC;
  END LOOP;
END;
$$;