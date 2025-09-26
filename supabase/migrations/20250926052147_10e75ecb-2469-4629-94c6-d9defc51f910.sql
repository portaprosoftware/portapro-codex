-- Create spill kit templates table
CREATE TABLE public.spill_kit_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    vehicle_types TEXT[] DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create spill kit template items table
CREATE TABLE public.spill_kit_template_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES public.spill_kit_templates(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    required_quantity INTEGER DEFAULT 1,
    expiration_trackable BOOLEAN DEFAULT false,
    critical_item BOOLEAN DEFAULT false,
    category TEXT DEFAULT 'general',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to existing vehicle_spill_kit_checks table
ALTER TABLE public.vehicle_spill_kit_checks 
ADD COLUMN template_id UUID REFERENCES public.spill_kit_templates(id),
ADD COLUMN item_conditions JSONB DEFAULT '{}',
ADD COLUMN photos TEXT[] DEFAULT '{}',
ADD COLUMN completion_status TEXT DEFAULT 'complete',
ADD COLUMN next_check_due DATE,
ADD COLUMN inspection_duration_minutes INTEGER,
ADD COLUMN weather_conditions TEXT;

-- Create spill kit inventory table
CREATE TABLE public.spill_kit_inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    item_name TEXT NOT NULL,
    current_stock INTEGER DEFAULT 0,
    minimum_threshold INTEGER DEFAULT 5,
    unit_cost NUMERIC DEFAULT 0,
    supplier_info JSONB DEFAULT '{}',
    last_restocked DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trigger for updated_at on templates
CREATE TRIGGER update_spill_kit_templates_updated_at
    BEFORE UPDATE ON public.spill_kit_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on inventory
CREATE TRIGGER update_spill_kit_inventory_updated_at
    BEFORE UPDATE ON public.spill_kit_inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get template for vehicle
CREATE OR REPLACE FUNCTION public.get_spill_kit_template_for_vehicle(vehicle_type_param TEXT)
RETURNS TABLE(template_id UUID, template_name TEXT, items JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', ti.id,
                    'item_name', ti.item_name,
                    'required_quantity', ti.required_quantity,
                    'expiration_trackable', ti.expiration_trackable,
                    'critical_item', ti.critical_item,
                    'category', ti.category,
                    'display_order', ti.display_order
                ) ORDER BY ti.display_order, ti.item_name
            ),
            '[]'::jsonb
        ) as items
    FROM public.spill_kit_templates t
    LEFT JOIN public.spill_kit_template_items ti ON t.id = ti.template_id
    WHERE t.is_active = true 
        AND (
            vehicle_type_param = ANY(t.vehicle_types) 
            OR t.is_default = true
        )
    GROUP BY t.id, t.name
    ORDER BY 
        CASE WHEN vehicle_type_param = ANY(t.vehicle_types) THEN 0 ELSE 1 END,
        t.is_default DESC,
        t.created_at DESC
    LIMIT 1;
END;
$$;

-- Create function to get overdue spill kit checks
CREATE OR REPLACE FUNCTION public.get_overdue_spill_kit_checks()
RETURNS TABLE(
    vehicle_id UUID,
    license_plate TEXT,
    last_check_date DATE,
    days_overdue INTEGER,
    next_check_due DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.license_plate,
        c.checked_at::date,
        (CURRENT_DATE - COALESCE(c.next_check_due, c.checked_at::date + INTERVAL '30 days'))::INTEGER,
        COALESCE(c.next_check_due, c.checked_at::date + INTERVAL '30 days')
    FROM public.vehicles v
    LEFT JOIN LATERAL (
        SELECT * FROM public.vehicle_spill_kit_checks vskc
        WHERE vskc.vehicle_id = v.id
        ORDER BY vskc.checked_at DESC
        LIMIT 1
    ) c ON true
    WHERE v.status = 'active'
        AND (
            c.checked_at IS NULL 
            OR COALESCE(c.next_check_due, c.checked_at::date + INTERVAL '30 days') < CURRENT_DATE
        )
    ORDER BY days_overdue DESC NULLS LAST;
END;
$$;

-- Insert default template with common spill kit items
INSERT INTO public.spill_kit_templates (name, description, is_default, vehicle_types) 
VALUES (
    'Standard DOT Spill Kit',
    'Standard DOT compliant spill kit for commercial vehicles',
    true,
    ARRAY['truck', 'van', 'trailer']
);

-- Get the template ID for inserting items
DO $$
DECLARE
    template_uuid UUID;
BEGIN
    SELECT id INTO template_uuid FROM public.spill_kit_templates WHERE name = 'Standard DOT Spill Kit';
    
    -- Insert default template items
    INSERT INTO public.spill_kit_template_items (template_id, item_name, required_quantity, critical_item, category, display_order) VALUES
    (template_uuid, 'Absorbent Pads (Oil-Only)', 25, true, 'absorbents', 1),
    (template_uuid, 'Absorbent Booms (3" x 4ft)', 4, true, 'absorbents', 2),
    (template_uuid, 'Granular Absorbent (bag)', 1, true, 'absorbents', 3),
    (template_uuid, 'Nitrile Gloves (pairs)', 4, true, 'ppe', 4),
    (template_uuid, 'Safety Goggles', 2, true, 'ppe', 5),
    (template_uuid, 'Tyvek Suits', 2, false, 'ppe', 6),
    (template_uuid, 'Disposal Bags (heavy duty)', 6, true, 'disposal', 7),
    (template_uuid, 'Zip Ties', 10, false, 'disposal', 8),
    (template_uuid, 'Hazmat Labels', 5, true, 'disposal', 9),
    (template_uuid, 'Spill Response Instructions', 1, true, 'documentation', 10),
    (template_uuid, 'Emergency Contact Sheet', 1, true, 'documentation', 11);
END $$;