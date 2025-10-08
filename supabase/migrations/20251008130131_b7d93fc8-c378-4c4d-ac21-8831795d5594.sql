-- Deactivate existing categories (preserve data, don't delete)
UPDATE public.document_categories 
SET is_active = false
WHERE is_active = true;

-- Insert comprehensive fleet document categories
-- 🔧 Maintenance & Operations (Orange: #F97316)
INSERT INTO public.document_categories (name, description, icon, color, display_order, is_active) VALUES
('Maintenance & Repairs', 'Work orders, maintenance invoices, oil change records, tire replacements, equipment repairs', 'Wrench', '#F97316', 1, true),
('Fuel Receipts', 'Scanned receipts or PDFs for reimbursements, proof of purchase, or card audits', 'Fuel', '#F97316', 2, true),
('Inspection Reports', 'Daily/weekly vehicle inspections (DVIR), pre/post-trip checklists, photos of defects', 'ClipboardCheck', '#F97316', 3, true),
('Service Records', 'Records of recurring or scheduled maintenance (e.g., 10K mile services, PM logs)', 'FileText', '#F97316', 4, true),
('Work Orders', 'Shop or vendor work authorizations and completion forms', 'ClipboardList', '#F97316', 5, true),

-- 🧾 Vehicle Ownership & Compliance (Blue: #3B82F6)
('Registration', 'Vehicle registration cards, plate renewals, DMV forms', 'FileCheck', '#3B82F6', 6, true),
('Title / Ownership', 'Title documents, lien release letters, purchase agreements', 'ScrollText', '#3B82F6', 7, true),
('Insurance', 'Certificates, claim reports, policy renewals', 'Shield', '#3B82F6', 8, true),
('Emissions & Inspection Certificates', 'State inspection stickers, smog/emissions tests, compliance proof', 'BadgeCheck', '#3B82F6', 9, true),
('Permits & Licensing', 'DOT/MC permits, fuel tax decals, environmental or waste-hauling permits', 'FileKey', '#3B82F6', 10, true),

-- 👷 Driver & Personnel (Purple: #8B5CF6)
('Driver License & ID', 'Copies of CDL or personal driver licenses, medical cards', 'IdCard', '#8B5CF6', 11, true),
('Training Certificates', 'OSHA, safety, or equipment operation training proofs', 'GraduationCap', '#8B5CF6', 12, true),
('Accident / Incident Reports', 'Vehicle accident photos, claim reports, witness statements', 'AlertTriangle', '#8B5CF6', 13, true),
('Disciplinary / Safety Records', 'Notes, violations, or driver compliance warnings', 'ShieldAlert', '#8B5CF6', 14, true),

-- 🏗️ Equipment & Asset Management (Green: #10B981)
('Equipment Manuals', 'Manuals for trucks, pumps, or mounted units', 'BookOpen', '#10B981', 15, true),
('Warranty Documents', 'Product or equipment warranties and service guarantees', 'Award', '#10B981', 16, true),
('Purchase / Lease Agreements', 'Vehicle or equipment financing and lease terms', 'FileSignature', '#10B981', 17, true),
('Upfit / Modification Docs', 'Invoices and specs for equipment added to vehicles (e.g., PTO systems, racks)', 'Settings', '#10B981', 18, true),

-- 📸 Photos & Visual Records (Gray: #6B7280)
('Vehicle Photos', 'Before/after service, damage documentation, condition photos', 'Camera', '#6B7280', 19, true),
('Job Site Photos', 'Proof-of-service images, portable unit placement photos, customer site access', 'Image', '#6B7280', 20, true),
('Compliance Photos', 'Photos showing license plates, VINs, inspection stickers, or signage', 'ScanLine', '#6B7280', 21, true),

-- 📂 Financial & Administrative (Amber: #F59E0B)
('Invoices & Receipts', 'Vendor invoices, receipts for parts or tools', 'Receipt', '#F59E0B', 22, true),
('Purchase Orders', 'Orders for vehicles, tires, parts, or external services', 'ShoppingCart', '#F59E0B', 23, true),
('Tax Documents', 'IFTA, fuel tax, depreciation or accounting files', 'Calculator', '#F59E0B', 24, true),
('Contracts & Agreements', 'Vendor, customer, or service contracts', 'FileText', '#F59E0B', 25, true),

-- ⚙️ Catch-All / Miscellaneous (Slate: #64748B)
('Other Documents', 'Anything that doesn''t fit another category', 'File', '#64748B', 26, true),
('Temporary / Draft Files', 'Working notes, estimates, or unfiled uploads', 'FileDashed', '#64748B', 27, true);