-- Tier 2: Compliance & Future-Proofing fields for mobile_fuel_vendors

-- Add Tier 2 columns
ALTER TABLE public.mobile_fuel_vendors
ADD COLUMN IF NOT EXISTS insurance_expiration_date DATE,
ADD COLUMN IF NOT EXISTS dot_hazmat_permit TEXT,
ADD COLUMN IF NOT EXISTS safety_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS fuel_certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS contract_document_url TEXT,
ADD COLUMN IF NOT EXISTS w9_document_url TEXT,
ADD COLUMN IF NOT EXISTS insurance_document_url TEXT,
ADD COLUMN IF NOT EXISTS last_audit_date DATE;

-- Add check constraint for safety_status
ALTER TABLE public.mobile_fuel_vendors
DROP CONSTRAINT IF EXISTS check_safety_status,
ADD CONSTRAINT check_safety_status 
  CHECK (safety_status IN ('verified', 'pending', 'flagged'));

-- Create storage bucket for mobile fuel vendor documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('mobile-vendor-docs', 'mobile-vendor-docs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for mobile-vendor-docs bucket
CREATE POLICY "Authenticated users can upload vendor documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mobile-vendor-docs');

CREATE POLICY "Authenticated users can view vendor documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'mobile-vendor-docs');

CREATE POLICY "Authenticated users can update vendor documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'mobile-vendor-docs');

CREATE POLICY "Authenticated users can delete vendor documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'mobile-vendor-docs');

-- Create materialized view for expiring vendor documents (for dashboard alerts)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.expiring_vendor_compliance AS
SELECT 
  v.id,
  v.vendor_id,
  v.vendor_name,
  v.insurance_expiration_date,
  v.last_audit_date,
  v.safety_status,
  CASE 
    WHEN v.insurance_expiration_date IS NOT NULL 
      AND v.insurance_expiration_date <= CURRENT_DATE + INTERVAL '30 days'
    THEN true
    ELSE false
  END as insurance_expiring_soon,
  CASE 
    WHEN v.last_audit_date IS NOT NULL 
      AND v.last_audit_date <= CURRENT_DATE - INTERVAL '1 year'
    THEN true
    ELSE false
  END as audit_overdue
FROM public.mobile_fuel_vendors v
WHERE v.is_active = true
  AND (
    (v.insurance_expiration_date IS NOT NULL AND v.insurance_expiration_date <= CURRENT_DATE + INTERVAL '30 days')
    OR (v.last_audit_date IS NOT NULL AND v.last_audit_date <= CURRENT_DATE - INTERVAL '1 year')
  );

-- Create index for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_expiring_vendor_compliance_id 
ON public.expiring_vendor_compliance(id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION public.refresh_vendor_compliance_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.expiring_vendor_compliance;
END;
$$;

-- Create trigger to auto-refresh when vendor data changes
CREATE OR REPLACE FUNCTION public.trigger_refresh_vendor_compliance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.refresh_vendor_compliance_alerts();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_vendor_compliance_change ON public.mobile_fuel_vendors;
CREATE TRIGGER trigger_vendor_compliance_change
AFTER INSERT OR UPDATE OF insurance_expiration_date, last_audit_date, safety_status, is_active
ON public.mobile_fuel_vendors
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_vendor_compliance();