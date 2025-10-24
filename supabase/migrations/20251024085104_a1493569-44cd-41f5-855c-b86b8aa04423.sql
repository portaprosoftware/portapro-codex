-- Create fee catalog table
CREATE TABLE IF NOT EXISTS public.fee_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  default_amount DECIMAL(10,2) NOT NULL,
  taxable BOOLEAN DEFAULT true,
  gl_code TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create auto requirement presets table
CREATE TABLE IF NOT EXISTS public.auto_requirement_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  preset_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  auto_actions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  job_id UUID REFERENCES public.jobs(id),
  customer_id UUID REFERENCES public.customers(id),
  site_id UUID,
  unit_id UUID,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  assigned_to TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  automation_rule_id TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fee_catalog_updated_at
  BEFORE UPDATE ON public.fee_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auto_requirement_presets_updated_at
  BEFORE UPDATE ON public.auto_requirement_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_tasks_updated_at
  BEFORE UPDATE ON public.maintenance_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default fee catalog entries
INSERT INTO public.fee_catalog (name, description, default_amount, category) VALUES
  ('Blocked Access Fee', 'Applied when unit cannot be serviced due to blocked access', 50.00, 'service_exception'),
  ('Extra Blue/Deodorizer', 'Additional deodorizer chemical usage', 15.00, 'consumables'),
  ('Excess Waste / Heavy Pump', 'Overfull unit or extended pump time', 25.00, 'service_exception'),
  ('Relocation Fee', 'Unit moved more than 25 feet from original location', 35.00, 'service_exception'),
  ('Tipped Unit Recovery', 'Unit found tipped over and required recovery', 25.00, 'service_exception'),
  ('Graffiti Removal', 'Cleaning and removal of graffiti', 35.00, 'cleaning'),
  ('Frozen Tank Treatment', 'Special treatment for frozen waste tank', 20.00, 'service_exception'),
  ('After-Hours Service', 'Service performed outside normal business hours', 40.00, 'premium'),
  ('Missing/Damaged Lock', 'Lock replacement or repair', 8.00, 'parts'),
  ('Anchor/Strap Add', 'Installation of wind anchoring or straps', 15.00, 'installation')
ON CONFLICT DO NOTHING;

-- Insert default auto requirement presets
INSERT INTO public.auto_requirement_presets (preset_type, name, description, conditions, required_fields, evidence_requirements, auto_actions) VALUES
  ('not_serviced', 'Not Serviced → Reason + Photo + GPS', 'Require documentation when a unit cannot be serviced', 
   '[{"field": "unit_status", "operator": "equals", "value": "Not Serviced"}]'::jsonb,
   '["not_serviced_reason", "not_serviced_photo"]'::jsonb,
   '{"min_photos": 1, "gps_required": true, "gps_accuracy": 50}'::jsonb,
   '{"create_task": true, "task_template": "follow_up_access_issue", "notify": ["dispatch"]}'::jsonb),
  
  ('damage', 'Damage/Issue → Photos + Task', 'Require photos and create repair task for any damage', 
   '[{"field": "damage_detected", "operator": "equals", "value": true}]'::jsonb,
   '["damage_photos", "damage_description"]'::jsonb,
   '{"min_photos": 2, "photo_types": ["close_up", "context"]}'::jsonb,
   '{"create_task": true, "task_template": "repair_damage", "due_days": 3}'::jsonb),
  
  ('delivery_setup', 'Delivery/Setup → Placement Proof', 'Require placement documentation for deliveries', 
   '[{"field": "template_type", "operator": "equals", "value": "delivery"}]'::jsonb,
   '["placement_map_pin", "surface_type", "level_check", "distance_from_truck", "placement_photos"]'::jsonb,
   '{"min_photos": 2, "gps_required": true, "photo_types": ["door_side", "wide_angle"]}'::jsonb,
   '{}'::jsonb),
  
  ('pickup_removal', 'Pickup/Removal → Final Area Photo', 'Require proof that area is left clean', 
   '[{"field": "template_type", "operator": "equals", "value": "pickup"}]'::jsonb,
   '["area_clean_checkbox", "final_area_photo"]'::jsonb,
   '{"min_photos": 1}'::jsonb,
   '{}'::jsonb),
  
  ('event_service', 'Event Service → Zone/Bank + Count Check', 'Require zone tracking and reconciliation for events', 
   '[{"field": "template_type", "operator": "equals", "value": "event"}]'::jsonb,
   '["zone_selection", "bank_selection", "units_expected", "units_serviced"]'::jsonb,
   '{}'::jsonb,
   '{"validate_reconciliation": true}'::jsonb),
  
  ('ada_units', 'ADA Units → Access Checks', 'Ensure ADA compliance requirements are met', 
   '[{"field": "unit_type", "operator": "equals", "value": "ADA"}]'::jsonb,
   '["ground_level_check", "path_clear_check", "door_clearance_check", "ada_compliance_photo"]'::jsonb,
   '{"min_photos": 1, "photo_types": ["ramp_clearance"]}'::jsonb,
   '{}'::jsonb),
  
  ('spill_incident', 'Spill/Incident → Compliance Form + Notify', 'Handle spill incidents with full documentation', 
   '[{"field": "spill_incident", "operator": "equals", "value": true}]'::jsonb,
   '["spill_checklist", "spill_photos", "spill_location"]'::jsonb,
   '{"min_photos": 2, "gps_required": true}'::jsonb,
   '{"create_task": true, "task_template": "compliance_follow_up", "notify": ["dispatch", "safety"]}'::jsonb)
ON CONFLICT DO NOTHING;