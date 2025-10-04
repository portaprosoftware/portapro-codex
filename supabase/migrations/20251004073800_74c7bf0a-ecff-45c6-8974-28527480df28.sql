-- Preventive Maintenance (PM) Templates Table
CREATE TABLE IF NOT EXISTS public.pm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('vehicle', 'trailer', 'equipment')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('mileage', 'hours', 'days', 'multi')),
  trigger_interval INTEGER,
  trigger_config JSONB DEFAULT '{}',
  checklist_items JSONB DEFAULT '[]',
  estimated_labor_hours NUMERIC(5,2),
  estimated_cost NUMERIC(10,2),
  parts_list JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Work Order Items (Checklist) Table
CREATE TABLE IF NOT EXISTS public.work_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT,
  status TEXT CHECK (status IN ('pass', 'fail', 'na')),
  severity TEXT CHECK (severity IN ('critical', 'major', 'minor')),
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Work Order Parts Table
CREATE TABLE IF NOT EXISTS public.work_order_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  consumable_id UUID REFERENCES public.consumables(id),
  part_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC(10,2) DEFAULT 0,
  source TEXT CHECK (source IN ('truck', 'warehouse', 'vendor')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Work Order Labor Table
CREATE TABLE IF NOT EXISTS public.work_order_labor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  technician_name TEXT NOT NULL,
  hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fleet Costs Table (for tracking all vehicle/equipment costs)
CREATE TABLE IF NOT EXISTS public.fleet_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('vehicle', 'trailer', 'equipment')),
  cost_type TEXT NOT NULL CHECK (cost_type IN ('fuel', 'maintenance', 'repair', 'parts', 'labor', 'other')),
  cost_category TEXT,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  vendor TEXT,
  receipt_url TEXT,
  odometer INTEGER,
  engine_hours NUMERIC(10,2),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Disable RLS on all new tables (Clerk handles all auth)
ALTER TABLE public.pm_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_labor DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_costs DISABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_order_items_work_order_id ON public.work_order_items(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_parts_work_order_id ON public.work_order_parts(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_labor_work_order_id ON public.work_order_labor(work_order_id);
CREATE INDEX IF NOT EXISTS idx_fleet_costs_asset_id ON public.fleet_costs(asset_id);
CREATE INDEX IF NOT EXISTS idx_fleet_costs_date ON public.fleet_costs(date);
CREATE INDEX IF NOT EXISTS idx_pm_templates_asset_type ON public.pm_templates(asset_type);

-- Create update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pm_templates_updated_at BEFORE UPDATE ON public.pm_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_order_items_updated_at BEFORE UPDATE ON public.work_order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_order_parts_updated_at BEFORE UPDATE ON public.work_order_parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_order_labor_updated_at BEFORE UPDATE ON public.work_order_labor
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fleet_costs_updated_at BEFORE UPDATE ON public.fleet_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();