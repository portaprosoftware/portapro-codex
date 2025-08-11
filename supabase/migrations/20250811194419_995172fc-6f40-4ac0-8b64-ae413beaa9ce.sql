
-- 1) Seed certification_types with portable toilet industry certifications
WITH to_insert AS (
  SELECT * FROM (
    VALUES
      ('CDL Class B', 'Driver', 'Commercial Driver License Class B', 48, TRUE),
      ('DOT Medical Card', 'Driver', 'DOT medical examiner’s certificate', 24, TRUE),
      ('MVR Check', 'Compliance', 'Annual motor vehicle record check', 12, TRUE),
      ('OSHA Bloodborne Pathogens', 'Safety', 'Exposure control and procedures', 12, TRUE),
      ('Hazardous Waste Handling (RCRA)', 'Compliance', 'RCRA awareness and handling rules', 12, TRUE),
      ('Spill Response & Containment', 'Safety', 'Spill prevention, response and reporting', 12, TRUE),
      ('PPE & Safety', 'Safety', 'Proper use of PPE and safety basics', 12, TRUE),
      ('Confined Space Awareness', 'Safety', 'Recognize confined space hazards', 12, FALSE),
      ('Defensive Driving', 'Driver', 'Safe driving techniques', 24, TRUE),
      ('First Aid / CPR', 'Safety', 'First Aid / CPR basics', 24, TRUE),
      ('HAZMAT Awareness', 'Compliance', 'Hazardous materials awareness', 24, FALSE),
      ('Forklift Certification', 'Operations', 'Operating powered industrial trucks', 36, FALSE)
  ) AS v(name, category, description, valid_months, is_mandatory)
)
INSERT INTO public.certification_types (name, category, description, valid_months, is_mandatory)
SELECT t.name, t.category, t.description, t.valid_months, t.is_mandatory
FROM to_insert t
LEFT JOIN public.certification_types ct ON ct.name = t.name
WHERE ct.id IS NULL;

-- 2) Seed shift_templates for portable toilet operations
WITH templates AS (
  SELECT * FROM (
    VALUES
      ('Route AM',        'route',      'Morning route service shift',        '06:00', '14:00', '#2563eb'),
      ('Route PM',        'route',      'Afternoon route service shift',      '14:00', '22:00', '#7c3aed'),
      ('Unit Cleaning',   'cleaning',   'Unit cleaning shift',                '07:00', '15:30', '#16a34a'),
      ('Maintenance Shop','maintenance','Shop maintenance and repairs',       '08:00', '16:30', '#ea580c'),
      ('Delivery Route',  'delivery',   'Deliver new units to sites',         '06:00', '16:00', '#0ea5e9'),
      ('Pickup Route',    'pickup',     'Pickup units from sites',            '06:00', '16:00', '#06b6d4'),
      ('Yard Load/Unload','yard',       'Load/unload, prep units and trucks', '05:00', '09:00', '#059669')
  ) AS v(name, shift_type, description, start_time, end_time, color)
)
INSERT INTO public.shift_templates (name, shift_type, description, start_time, end_time, color)
SELECT t.name, t.shift_type, t.description, t.start_time::time, t.end_time::time, t.color
FROM templates t
LEFT JOIN public.shift_templates st ON st.name = t.name
WHERE st.id IS NULL;

-- 3) Seed training_requirements for roles: driver, dispatch, yard_tech, mechanic
-- Helper CTE: grab ids for certs we just seeded
WITH certs AS (
  SELECT id, name, valid_months FROM public.certification_types
),
ins AS (
  -- DRIVER
  INSERT INTO public.training_requirements (role, certification_type_id, is_required, frequency_months)
  SELECT 'driver', c.id, TRUE, c.valid_months
  FROM certs c
  WHERE c.name IN (
    'CDL Class B',
    'DOT Medical Card',
    'MVR Check',
    'Defensive Driving',
    'Spill Response & Containment',
    'Hazardous Waste Handling (RCRA)',
    'PPE & Safety',
    'First Aid / CPR',
    'OSHA Bloodborne Pathogens'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.training_requirements tr
    WHERE tr.role = 'driver' AND tr.certification_type_id = c.id
  )
  RETURNING 1
), ins2 AS (
  -- DISPATCH
  INSERT INTO public.training_requirements (role, certification_type_id, is_required, frequency_months)
  SELECT 'dispatch', c.id,
         CASE WHEN c.name IN ('PPE & Safety') THEN TRUE ELSE FALSE END,
         c.valid_months
  FROM certs c
  WHERE c.name IN (
    'PPE & Safety',
    'Spill Response & Containment',
    'First Aid / CPR'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.training_requirements tr
    WHERE tr.role = 'dispatch' AND tr.certification_type_id = c.id
  )
  RETURNING 1
), ins3 AS (
  -- YARD TECH
  INSERT INTO public.training_requirements (role, certification_type_id, is_required, frequency_months)
  SELECT 'yard_tech', c.id,
         CASE WHEN c.name IN ('PPE & Safety','Spill Response & Containment','Hazardous Waste Handling (RCRA)') THEN TRUE ELSE FALSE END,
         c.valid_months
  FROM certs c
  WHERE c.name IN (
    'Forklift Certification',
    'PPE & Safety',
    'Spill Response & Containment',
    'Hazardous Waste Handling (RCRA)',
    'First Aid / CPR',
    'OSHA Bloodborne Pathogens',
    'Confined Space Awareness'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.training_requirements tr
    WHERE tr.role = 'yard_tech' AND tr.certification_type_id = c.id
  )
  RETURNING 1
)
-- MECHANIC
INSERT INTO public.training_requirements (role, certification_type_id, is_required, frequency_months)
SELECT 'mechanic', c.id,
       CASE WHEN c.name IN ('PPE & Safety','First Aid / CPR','Hazardous Waste Handling (RCRA)') THEN TRUE ELSE FALSE END,
       c.valid_months
FROM certs c
WHERE c.name IN (
  'PPE & Safety',
  'First Aid / CPR',
  'Hazardous Waste Handling (RCRA)'
)
AND NOT EXISTS (
  SELECT 1 FROM public.training_requirements tr
  WHERE tr.role = 'mechanic' AND tr.certification_type_id = c.id
);

-- 4) Create storage bucket for certificate files with public read and public upload
-- Create bucket if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('training-certificates', 'training-certificates', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Policy: allow anyone to read objects in 'training-certificates'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public read training-certificates'
  ) THEN
    CREATE POLICY "Public read training-certificates"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'training-certificates');
  END IF;
END $$;

-- Policy: allow public insert (upload) into 'training-certificates'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public upload training-certificates'
  ) THEN
    CREATE POLICY "Public upload training-certificates"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'training-certificates');
  END IF;
END $$;
