-- Phase 1: Work Orders Schema Completion (Fixed)

-- 1.1 Add missing columns to work_orders table
ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS work_order_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS vendor_id UUID,
  ADD COLUMN IF NOT EXISTS po_number TEXT,
  ADD COLUMN IF NOT EXISTS out_of_service BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taxes_fees NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_context TEXT,
  ADD COLUMN IF NOT EXISTS dvir_report_id UUID REFERENCES dvir_reports(id),
  ADD COLUMN IF NOT EXISTS pm_schedule_id UUID REFERENCES vehicle_pm_schedules(id),
  ADD COLUMN IF NOT EXISTS return_to_service_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS technician_signature_id UUID,
  ADD COLUMN IF NOT EXISTS reviewer_signature_id UUID,
  ADD COLUMN IF NOT EXISTS driver_verification_id UUID;

-- 1.2 Create work_order_signatures table
CREATE TABLE IF NOT EXISTS work_order_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  signature_type TEXT NOT NULL CHECK (signature_type IN ('technician', 'reviewer', 'driver')),
  signed_by UUID NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signature_data TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wo_signatures_wo_id ON work_order_signatures(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_signatures_type ON work_order_signatures(signature_type);

-- 1.3 Create work_order_history table
CREATE TABLE IF NOT EXISTS work_order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  note TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_wo_history_wo_id ON work_order_history(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_history_changed_at ON work_order_history(changed_at DESC);

-- 1.4 Create tenant-scoped WO number generator function
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TEXT AS $$
DECLARE
  year_prefix TEXT := TO_CHAR(NOW(), 'YYYY');
  next_num INTEGER;
  new_number TEXT;
BEGIN
  -- Get the highest WO number for current year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(work_order_number FROM 'WO-\d{4}-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM work_orders
  WHERE work_order_number LIKE 'WO-' || year_prefix || '-%';
  
  new_number := 'WO-' || year_prefix || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- 1.5 Create trigger function to auto-generate WO numbers
CREATE OR REPLACE FUNCTION set_work_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.work_order_number IS NULL OR NEW.work_order_number = '' THEN
    NEW.work_order_number := generate_work_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1.6 Create trigger on work_orders table
DROP TRIGGER IF EXISTS trigger_set_work_order_number ON work_orders;
CREATE TRIGGER trigger_set_work_order_number
  BEFORE INSERT ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_work_order_number();