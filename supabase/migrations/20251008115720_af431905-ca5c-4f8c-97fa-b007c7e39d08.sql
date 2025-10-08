-- Tier 3: Advanced Analytics & Compliance

-- Add analytics and compliance fields to mobile_fuel_services
ALTER TABLE mobile_fuel_services
ADD COLUMN fees_breakdown JSONB DEFAULT '{}',
ADD COLUMN after_hours_service BOOLEAN DEFAULT false,
ADD COLUMN location_type TEXT CHECK (location_type IN ('yard', 'job_site', 'remote', 'emergency')),
ADD COLUMN location_description TEXT,
ADD COLUMN service_quality_rating INTEGER CHECK (service_quality_rating >= 1 AND service_quality_rating <= 5),
ADD COLUMN invoice_reconciled BOOLEAN DEFAULT false,
ADD COLUMN reconciliation_date TIMESTAMPTZ;

-- Create index for reporting queries
CREATE INDEX idx_mobile_fuel_services_after_hours ON mobile_fuel_services(after_hours_service);
CREATE INDEX idx_mobile_fuel_services_location_type ON mobile_fuel_services(location_type);
CREATE INDEX idx_mobile_fuel_services_quality_rating ON mobile_fuel_services(service_quality_rating);
CREATE INDEX idx_mobile_fuel_services_reconciled ON mobile_fuel_services(invoice_reconciled);

-- Add comment for fees_breakdown structure
COMMENT ON COLUMN mobile_fuel_services.fees_breakdown IS 'JSON structure: {delivery_fee: number, environmental_fee: number, excise_tax: number, fuel_tax: number, other_fees: [{description: string, amount: number}]}';