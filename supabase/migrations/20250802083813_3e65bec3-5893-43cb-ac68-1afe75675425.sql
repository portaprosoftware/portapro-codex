-- Create table for filter presets
CREATE TABLE public.filter_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  filter_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  preset_type TEXT NOT NULL DEFAULT 'jobs'::text,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT, -- Clerk user ID
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create table for filter preset usage analytics
CREATE TABLE public.filter_preset_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preset_id UUID REFERENCES public.filter_presets(id) ON DELETE CASCADE,
  user_id TEXT, -- Clerk user ID
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  filter_modifications JSONB DEFAULT '{}'::jsonb,
  results_count INTEGER
);

-- Create function to update preset usage count
CREATE OR REPLACE FUNCTION public.update_preset_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.filter_presets 
  SET usage_count = usage_count + 1, last_used_at = NEW.used_at 
  WHERE id = NEW.preset_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update usage count
CREATE TRIGGER update_preset_usage_trigger
  AFTER INSERT ON public.filter_preset_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_preset_usage_count();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_filter_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_filter_presets_updated_at_trigger
  BEFORE UPDATE ON public.filter_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_filter_presets_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_filter_presets_created_by ON public.filter_presets(created_by);
CREATE INDEX idx_filter_presets_preset_type ON public.filter_presets(preset_type);
CREATE INDEX idx_filter_presets_is_public ON public.filter_presets(is_public);
CREATE INDEX idx_filter_preset_usage_preset_id ON public.filter_preset_usage(preset_id);
CREATE INDEX idx_filter_preset_usage_user_id ON public.filter_preset_usage(user_id);