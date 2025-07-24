-- Complete Phase 4: Create missing QR consumable requests table
CREATE TABLE public.qr_consumable_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consumable_id UUID NOT NULL,
  requested_quantity INTEGER NOT NULL DEFAULT 1,
  urgency_level TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by_name TEXT NOT NULL,
  job_reference TEXT,
  notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT qr_consumable_requests_urgency_check 
    CHECK (urgency_level IN ('low', 'normal', 'high', 'critical')),
  CONSTRAINT qr_consumable_requests_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled'))
);

-- Enable RLS
ALTER TABLE public.qr_consumable_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public access to QR consumable requests" 
ON public.qr_consumable_requests 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_qr_consumable_requests_consumable_id ON public.qr_consumable_requests(consumable_id);
CREATE INDEX idx_qr_consumable_requests_status ON public.qr_consumable_requests(status);
CREATE INDEX idx_qr_consumable_requests_created_at ON public.qr_consumable_requests(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_qr_consumable_requests_updated_at
  BEFORE UPDATE ON public.qr_consumable_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Phase 5: Create advanced enterprise tables
-- 1. External API Integrations
CREATE TABLE public.api_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_name TEXT NOT NULL,
  integration_type TEXT NOT NULL, -- 'supplier', 'erp', 'procurement', 'analytics'
  api_endpoint TEXT NOT NULL,
  auth_method TEXT NOT NULL DEFAULT 'api_key', -- 'api_key', 'oauth', 'basic'
  is_active BOOLEAN NOT NULL DEFAULT true,
  sync_frequency INTEGER NOT NULL DEFAULT 60, -- minutes
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'never', -- 'never', 'success', 'error', 'in_progress'
  error_message TEXT,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Workflow automation rules
CREATE TABLE public.consumable_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  workflow_type TEXT NOT NULL, -- 'auto_approval', 'auto_reorder', 'notification_chain'
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Advanced supplier management
CREATE TABLE public.supplier_catalogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_name TEXT NOT NULL,
  api_integration_id UUID REFERENCES public.api_integrations(id),
  catalog_data JSONB NOT NULL DEFAULT '{}',
  pricing_tiers JSONB DEFAULT '{}',
  contract_terms JSONB DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Multi-location management
CREATE TABLE public.warehouse_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_name TEXT NOT NULL,
  location_code TEXT NOT NULL UNIQUE,
  address TEXT,
  coordinates POINT,
  manager_id UUID,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  capacity_limits JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.stock_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transfer_number TEXT NOT NULL UNIQUE,
  from_location_id UUID NOT NULL REFERENCES public.warehouse_locations(id),
  to_location_id UUID NOT NULL REFERENCES public.warehouse_locations(id),
  consumable_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_transit', 'completed', 'cancelled'
  requested_by UUID,
  approved_by UUID,
  shipped_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Enterprise reporting schedules
CREATE TABLE public.report_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'usage', 'cost', 'efficiency', 'predictive'
  schedule_expression TEXT NOT NULL, -- cron format
  recipients JSONB NOT NULL DEFAULT '[]', -- email addresses
  parameters JSONB DEFAULT '{}',
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Real-time collaboration
CREATE TABLE public.consumable_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL, -- 'request', 'usage', 'restock', 'transfer'
  entity_type TEXT NOT NULL, -- 'consumable', 'job', 'location'
  entity_id UUID NOT NULL,
  user_id UUID,
  user_name TEXT,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumable_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumable_activities ENABLE ROW LEVEL SECURITY;

-- Create public access policies for all tables
CREATE POLICY "Public access to api integrations" ON public.api_integrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to workflows" ON public.consumable_workflows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to supplier catalogs" ON public.supplier_catalogs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to warehouse locations" ON public.warehouse_locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to stock transfers" ON public.stock_transfers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to report schedules" ON public.report_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to activities" ON public.consumable_activities FOR ALL USING (true) WITH CHECK (true);

-- Create update triggers
CREATE TRIGGER update_api_integrations_updated_at BEFORE UPDATE ON public.api_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consumable_workflows_updated_at BEFORE UPDATE ON public.consumable_workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_supplier_catalogs_updated_at BEFORE UPDATE ON public.supplier_catalogs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warehouse_locations_updated_at BEFORE UPDATE ON public.warehouse_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_transfers_updated_at BEFORE UPDATE ON public.stock_transfers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_report_schedules_updated_at BEFORE UPDATE ON public.report_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_consumable_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consumable_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_transfers;