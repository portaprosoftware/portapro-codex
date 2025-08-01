-- Phase 5: Security & Compliance Implementation

-- Create table for padlock code access audit logs
CREATE TABLE public.padlock_code_access_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_item_id uuid NOT NULL REFERENCES public.product_items(id) ON DELETE CASCADE,
  accessed_by uuid NOT NULL,
  access_timestamp timestamp with time zone NOT NULL DEFAULT now(),
  access_reason text,
  session_id text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for security incidents
CREATE TABLE public.padlock_security_incidents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_item_id uuid NOT NULL REFERENCES public.product_items(id) ON DELETE CASCADE,
  incident_type text NOT NULL CHECK (incident_type IN ('missing_padlock', 'damaged_padlock', 'unauthorized_access', 'lost_key', 'forgotten_combination')),
  reported_by uuid NOT NULL,
  reported_at timestamp with time zone NOT NULL DEFAULT now(),
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolution_notes text,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_padlock_code_access_logs_item ON public.padlock_code_access_logs(product_item_id);
CREATE INDEX idx_padlock_code_access_logs_user ON public.padlock_code_access_logs(accessed_by);
CREATE INDEX idx_padlock_code_access_logs_timestamp ON public.padlock_code_access_logs(access_timestamp);

CREATE INDEX idx_padlock_security_incidents_item ON public.padlock_security_incidents(product_item_id);
CREATE INDEX idx_padlock_security_incidents_status ON public.padlock_security_incidents(status);
CREATE INDEX idx_padlock_security_incidents_severity ON public.padlock_security_incidents(severity);

-- Create function to log padlock code access
CREATE OR REPLACE FUNCTION public.log_padlock_code_access(
  item_uuid uuid,
  user_uuid uuid,
  reason_text text DEFAULT NULL,
  session_id_param text DEFAULT NULL,
  ip_param text DEFAULT NULL,
  user_agent_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
  item_record RECORD;
BEGIN
  -- Check if user has permission to view padlock codes
  SELECT role::text INTO user_role 
  FROM public.user_roles 
  WHERE user_id::text = user_uuid::text 
  LIMIT 1;
  
  IF user_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User role not found');
  END IF;
  
  -- Only allow owners and dispatchers to view padlock codes
  IF user_role NOT IN ('owner', 'dispatcher') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions to access padlock codes');
  END IF;
  
  -- Get item details to verify it exists and has a padlock code
  SELECT * INTO item_record 
  FROM public.product_items 
  WHERE id = item_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found');
  END IF;
  
  IF item_record.padlock_code_reference IS NULL OR item_record.padlock_code_reference = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'No padlock code available for this item');
  END IF;
  
  -- Log the access attempt
  INSERT INTO public.padlock_code_access_logs (
    product_item_id,
    accessed_by,
    access_reason,
    session_id,
    ip_address,
    user_agent
  ) VALUES (
    item_uuid,
    user_uuid,
    reason_text,
    session_id_param,
    ip_param,
    user_agent_param
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'code_reference', item_record.padlock_code_reference,
    'padlock_type', item_record.padlock_type
  );
END;
$$;

-- Create function to report security incidents
CREATE OR REPLACE FUNCTION public.report_padlock_incident(
  item_uuid uuid,
  incident_type_param text,
  user_uuid uuid,
  description_param text,
  severity_param text DEFAULT 'medium'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate incident type
  IF incident_type_param NOT IN ('missing_padlock', 'damaged_padlock', 'unauthorized_access', 'lost_key', 'forgotten_combination') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid incident type');
  END IF;
  
  -- Validate severity
  IF severity_param NOT IN ('low', 'medium', 'high', 'critical') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid severity level');
  END IF;
  
  -- Create the incident report
  INSERT INTO public.padlock_security_incidents (
    product_item_id,
    incident_type,
    reported_by,
    description,
    severity
  ) VALUES (
    item_uuid,
    incident_type_param,
    user_uuid,
    description_param,
    severity_param
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Security incident reported successfully');
END;
$$;

-- Create function to get security incidents
CREATE OR REPLACE FUNCTION public.get_padlock_security_incidents(
  status_filter text DEFAULT NULL,
  severity_filter text DEFAULT NULL,
  limit_count integer DEFAULT 50
)
RETURNS TABLE(
  incident_id uuid,
  item_id uuid,
  item_code text,
  product_name text,
  incident_type text,
  severity text,
  status text,
  description text,
  reported_at timestamp with time zone,
  days_since_reported integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    psi.id,
    pi.id,
    pi.item_code,
    p.name,
    psi.incident_type,
    psi.severity,
    psi.status,
    psi.description,
    psi.reported_at,
    (EXTRACT(EPOCH FROM (NOW() - psi.reported_at)) / 86400)::integer as days_since_reported
  FROM public.padlock_security_incidents psi
  JOIN public.product_items pi ON psi.product_item_id = pi.id
  JOIN public.products p ON pi.product_id = p.id
  WHERE (status_filter IS NULL OR psi.status = status_filter)
    AND (severity_filter IS NULL OR psi.severity = severity_filter)
  ORDER BY psi.reported_at DESC
  LIMIT limit_count;
END;
$$;

-- Create function to update security incident status
CREATE OR REPLACE FUNCTION public.update_incident_status(
  incident_uuid uuid,
  new_status text,
  user_uuid uuid,
  resolution_notes_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate status
  IF new_status NOT IN ('open', 'investigating', 'resolved', 'closed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid status');
  END IF;
  
  -- Update the incident
  UPDATE public.padlock_security_incidents 
  SET 
    status = new_status,
    resolution_notes = CASE WHEN new_status IN ('resolved', 'closed') THEN resolution_notes_param ELSE resolution_notes END,
    resolved_by = CASE WHEN new_status IN ('resolved', 'closed') THEN user_uuid ELSE resolved_by END,
    resolved_at = CASE WHEN new_status IN ('resolved', 'closed') THEN NOW() ELSE resolved_at END,
    updated_at = NOW()
  WHERE id = incident_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Incident not found');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'Incident status updated successfully');
END;
$$;

-- Create trigger to update incident updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_padlock_incidents_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_padlock_security_incidents_updated_at
    BEFORE UPDATE ON public.padlock_security_incidents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_padlock_incidents_updated_at();