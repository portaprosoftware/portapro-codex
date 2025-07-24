-- Add missing tables for Phase 6 consumables functionality

-- Consumable notification settings
CREATE TABLE public.consumable_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  low_stock_enabled BOOLEAN NOT NULL DEFAULT true,
  low_stock_threshold_days INTEGER NOT NULL DEFAULT 7,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  sms_notifications BOOLEAN NOT NULL DEFAULT false,
  dashboard_alerts BOOLEAN NOT NULL DEFAULT true,
  email_recipients TEXT[] DEFAULT '{}',
  sms_recipients TEXT[] DEFAULT '{}',
  notification_frequency TEXT NOT NULL DEFAULT 'daily',
  business_hours_only BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consumable_notification_settings ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
CREATE POLICY "Public access to notification settings" 
ON public.consumable_notification_settings 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_consumable_notification_settings_updated_at
  BEFORE UPDATE ON public.consumable_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed consumables with common items
INSERT INTO public.consumables (name, description, category, sku, unit_cost, unit_price, on_hand_qty, reorder_threshold, supplier_info, is_active, created_by) VALUES
('Blue Deodorizer Liquid', 'Standard blue deodorizer for portable toilets', 'deodorizer', 'DEOD-001', 2.50, 4.00, 50, 10, '{"vendor": "ChemCorp", "order_code": "BC-BLUE-001"}', true, NULL),
('Pink Deodorizer Liquid', 'Pink deodorizer with fresh scent', 'deodorizer', 'DEOD-002', 2.75, 4.25, 30, 10, '{"vendor": "ChemCorp", "order_code": "BC-PINK-001"}', true, NULL),
('Sanitizer Spray', 'Antibacterial sanitizer spray for units', 'sanitizer', 'SAN-001', 3.25, 5.50, 25, 8, '{"vendor": "CleanPro", "order_code": "CP-SAN-500"}', true, NULL),
('Hand Sanitizer Gel', 'Alcohol-based hand sanitizer gel', 'sanitizer', 'SAN-002', 1.85, 3.25, 40, 12, '{"vendor": "CleanPro", "order_code": "CP-GEL-250"}', true, NULL),
('Toilet Paper Rolls', '2-ply toilet paper for portable units', 'supplies', 'SUP-001', 0.85, 1.50, 200, 50, '{"vendor": "PaperPlus", "order_code": "PP-2PLY-IND"}', true, NULL),
('Paper Towels', 'Absorbent paper towels for handwash stations', 'supplies', 'SUP-002', 1.25, 2.25, 100, 25, '{"vendor": "PaperPlus", "order_code": "PP-TOWEL-200"}', true, NULL),
('Urinal Blocks', 'Deodorizing urinal blocks', 'maintenance', 'MAIN-001', 0.95, 1.75, 75, 20, '{"vendor": "ChemCorp", "order_code": "BC-URIN-BLOCK"}', true, NULL),
('Tank Treatment', 'Waste tank treatment solution', 'maintenance', 'MAIN-002', 4.50, 7.25, 15, 5, '{"vendor": "ChemCorp", "order_code": "BC-TANK-TREAT"}', true, NULL),
('Disinfectant Wipes', 'Antibacterial surface wipes', 'cleaning', 'CLEAN-001', 2.15, 3.75, 60, 15, '{"vendor": "CleanPro", "order_code": "CP-WIPES-80"}', true, NULL),
('Floor Cleaner', 'Heavy-duty floor cleaning solution', 'cleaning', 'CLEAN-002', 3.85, 6.50, 20, 6, '{"vendor": "CleanPro", "order_code": "CP-FLOOR-GAL"}', true, NULL);

-- Add some sample low stock notifications for testing
INSERT INTO public.notification_logs (user_id, notification_type, title, body, data, related_entity_type, related_entity_id) VALUES
('00000000-0000-0000-0000-000000000000', 'consumable_low_stock', 'Low Stock Alert: Tank Treatment', 'Tank Treatment is running low with only 15 units remaining (threshold: 5)', '{"consumable_name": "Tank Treatment", "current_stock": 15, "threshold": 5}', 'consumable', (SELECT id FROM consumables WHERE name = 'Tank Treatment' LIMIT 1)),
('00000000-0000-0000-0000-000000000000', 'consumable_low_stock', 'Low Stock Alert: Floor Cleaner', 'Floor Cleaner is running low with only 20 units remaining (threshold: 6)', '{"consumable_name": "Floor Cleaner", "current_stock": 20, "threshold": 6}', 'consumable', (SELECT id FROM consumables WHERE name = 'Floor Cleaner' LIMIT 1));

-- Create function to automatically create low stock notifications
CREATE OR REPLACE FUNCTION public.check_consumable_stock()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  low_stock_item RECORD;
  settings RECORD;
BEGIN
  -- Get notification settings
  SELECT * INTO settings 
  FROM public.consumable_notification_settings 
  WHERE low_stock_enabled = true
  LIMIT 1;
  
  -- If no settings or notifications disabled, exit
  IF NOT FOUND OR NOT settings.low_stock_enabled THEN
    RETURN;
  END IF;
  
  -- Find items below threshold
  FOR low_stock_item IN 
    SELECT * 
    FROM public.consumables 
    WHERE is_active = true 
      AND on_hand_qty <= reorder_threshold
      AND NOT EXISTS (
        SELECT 1 FROM public.notification_logs 
        WHERE related_entity_id = consumables.id 
          AND notification_type = 'consumable_low_stock'
          AND sent_at >= CURRENT_DATE
      )
  LOOP
    -- Create notification
    INSERT INTO public.notification_logs (
      user_id,
      notification_type,
      title,
      body,
      data,
      related_entity_type,
      related_entity_id
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'consumable_low_stock',
      'Low Stock Alert: ' || low_stock_item.name,
      low_stock_item.name || ' is running low with only ' || low_stock_item.on_hand_qty || ' units remaining (threshold: ' || low_stock_item.reorder_threshold || ')',
      jsonb_build_object(
        'consumable_name', low_stock_item.name,
        'current_stock', low_stock_item.on_hand_qty,
        'threshold', low_stock_item.reorder_threshold,
        'category', low_stock_item.category
      ),
      'consumable',
      low_stock_item.id
    );
  END LOOP;
END;
$$;

-- Insert default notification settings
INSERT INTO public.consumable_notification_settings (
  low_stock_enabled,
  email_notifications,
  dashboard_alerts,
  email_recipients,
  notification_frequency
) VALUES (
  true,
  true,
  true,
  ARRAY['admin@company.com'],
  'daily'
);