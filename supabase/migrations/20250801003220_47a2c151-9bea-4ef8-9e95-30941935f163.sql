-- Create mock customers in NYC area
INSERT INTO public.customers (id, name, email, phone, service_street, service_city, service_state, service_zip, customer_type) VALUES
('11111111-1111-1111-1111-111111111111', 'Central Park Events', 'events@centralpark.nyc', '(212) 555-0101', '1 E 79th St', 'New York', 'NY', '10075', 'events_festivals'),
('22222222-2222-2222-2222-222222222222', 'Brooklyn Construction Co', 'info@brooklynconst.com', '(718) 555-0201', '456 Atlantic Ave', 'Brooklyn', 'NY', '11217', 'construction'),
('33333333-3333-3333-3333-333333333333', 'Manhattan Office Plaza', 'facilities@moplan.com', '(212) 555-0301', '200 Park Ave', 'New York', 'NY', '10166', 'corporate'),
('44444444-4444-4444-4444-444444444444', 'Queens Festival Grounds', 'contact@queensfest.org', '(718) 555-0401', '123-01 Roosevelt Ave', 'Corona', 'NY', '11368', 'events_festivals'),
('55555555-5555-5555-5555-555555555555', 'Bronx Stadium Services', 'ops@bronxstadium.com', '(718) 555-0501', '1 E 161st St', 'Bronx', 'NY', '10451', 'events_festivals'),
('66666666-6666-6666-6666-666666666666', 'Staten Island Marina', 'info@simarina.com', '(718) 555-0601', '100 Richmond Terrace', 'Staten Island', 'NY', '10301', 'other'),
('77777777-7777-7777-7777-777777777777', 'Times Square Productions', 'production@timessq.com', '(212) 555-0701', '1500 Broadway', 'New York', 'NY', '10036', 'events_festivals'),
('88888888-8888-8888-8888-888888888888', 'LIC Warehouse District', 'contact@licware.com', '(718) 555-0801', '45-18 Court Sq', 'Long Island City', 'NY', '11101', 'construction');

-- Create mock vehicles if they don't exist
INSERT INTO public.vehicles (id, license_plate, vehicle_type, status, capacity) VALUES
('aaaa1111-bbbb-2222-cccc-333333333333', 'NYC-001', 'Truck', 'active', 10),
('bbbb2222-cccc-3333-dddd-444444444444', 'NYC-002', 'Van', 'active', 6),
('cccc3333-dddd-4444-eeee-555555555555', 'NYC-003', 'Truck', 'active', 12),
('dddd4444-eeee-5555-ffff-666666666666', 'NYC-004', 'Van', 'active', 8)
ON CONFLICT (id) DO NOTHING;

-- Create mock jobs around NYC area
INSERT INTO public.jobs (
  id, customer_id, job_type, status, scheduled_date, scheduled_time, 
  driver_id, vehicle_id, job_number, notes, timezone
) VALUES
-- Today's jobs
('job11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'delivery', 'in_progress', '2025-08-01', '08:00', '0146044b-0d90-4eee-9605-fcec54e057be', 'aaaa1111-bbbb-2222-cccc-333333333333', 'DEL-001', 'Central Park summer festival setup', 'America/New_York'),
('job22222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'service', 'assigned', '2025-08-01', '10:30', 'cd64b23d-e9aa-462b-b18e-c6370b2ec7ed', 'bbbb2222-cccc-3333-dddd-444444444444', 'SVC-001', 'Weekly service for construction site', 'America/New_York'),
('job33333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'pickup', 'assigned', '2025-08-01', '14:00', 'df90b74b-eb0f-4409-a807-67f49a79fee5', 'cccc3333-dddd-4444-eeee-555555555555', 'PKP-001', 'Office plaza equipment pickup', 'America/New_York'),
('job44444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'delivery', 'completed', '2025-08-01', '07:00', '491ca5c1-6087-4bf3-b1c9-9d71612251d9', 'dddd4444-eeee-5555-ffff-666666666666', 'DEL-002', 'Queens festival morning delivery', 'America/New_York'),

-- Tomorrow's jobs
('job55555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'service', 'assigned', '2025-08-02', '09:00', 'b0327779-3882-4a3c-b98b-4c0fec0e5d22', 'aaaa1111-bbbb-2222-cccc-333333333333', 'SVC-002', 'Bronx Stadium maintenance service', 'America/New_York'),
('job66666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'delivery', 'assigned', '2025-08-02', '11:30', '0146044b-0d90-4eee-9605-fcec54e057be', 'bbbb2222-cccc-3333-dddd-444444444444', 'DEL-003', 'Staten Island Marina event setup', 'America/New_York'),
('job77777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 'pickup', 'assigned', '2025-08-02', '16:00', 'cd64b23d-e9aa-462b-b18e-c6370b2ec7ed', 'cccc3333-dddd-4444-eeee-555555555555', 'PKP-002', 'Times Square production wrap-up', 'America/New_York'),
('job88888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'service', 'assigned', '2025-08-02', '13:00', 'df90b74b-eb0f-4409-a807-67f49a79fee5', 'dddd4444-eeee-5555-ffff-666666666666', 'SVC-003', 'LIC warehouse weekly service', 'America/New_York'),

-- Weekend jobs
('job99999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'pickup', 'assigned', '2025-08-03', '15:00', '491ca5c1-6087-4bf3-b1c9-9d71612251d9', 'aaaa1111-bbbb-2222-cccc-333333333333', 'PKP-003', 'Central Park weekend event cleanup', 'America/New_York'),
('jobaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'delivery', 'assigned', '2025-08-04', '08:30', 'b0327779-3882-4a3c-b98b-4c0fec0e5d22', 'bbbb2222-cccc-3333-dddd-444444444444', 'DEL-004', 'Queens festival Monday setup', 'America/New_York');

-- Create service locations for better mapping
INSERT INTO public.customer_service_locations (
  customer_id, location_name, street, city, state, zip, 
  gps_coordinates, is_default, is_active
) VALUES
('11111111-1111-1111-1111-111111111111', 'Central Park - Main Location', '1 E 79th St', 'New York', 'NY', '10075', '(-73.9712,40.7831)', true, true),
('22222222-2222-2222-2222-222222222222', 'Brooklyn Site - Main Location', '456 Atlantic Ave', 'Brooklyn', 'NY', '11217', '(-73.9857,40.6892)', true, true),
('33333333-3333-3333-3333-333333333333', 'Manhattan Office - Main Location', '200 Park Ave', 'New York', 'NY', '10166', '(-73.9776,40.7505)', true, true),
('44444444-4444-4444-4444-444444444444', 'Queens Festival - Main Location', '123-01 Roosevelt Ave', 'Corona', 'NY', '11368', '(-73.8648,40.7489)', true, true),
('55555555-5555-5555-5555-555555555555', 'Bronx Stadium - Main Location', '1 E 161st St', 'Bronx', 'NY', '10451', '(-73.9284,40.8296)', true, true),
('66666666-6666-6666-6666-666666666666', 'Staten Island - Main Location', '100 Richmond Terrace', 'Staten Island', 'NY', '10301', '(-74.0776,40.6436)', true, true),
('77777777-7777-7777-7777-777777777777', 'Times Square - Main Location', '1500 Broadway', 'New York', 'NY', '10036', '(-73.9857,40.7590)', true, true),
('88888888-8888-8888-8888-888888888888', 'LIC Warehouse - Main Location', '45-18 Court Sq', 'Long Island City', 'NY', '11101', '(-73.9457,40.7472)', true, true)
ON CONFLICT (customer_id, location_name) DO NOTHING;