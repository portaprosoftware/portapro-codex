-- Add OCR tracking fields to product_items table
ALTER TABLE public.product_items 
ADD COLUMN IF NOT EXISTS tool_number text,
ADD COLUMN IF NOT EXISTS vendor_id text,
ADD COLUMN IF NOT EXISTS manufacturing_date date,
ADD COLUMN IF NOT EXISTS plastic_code text,
ADD COLUMN IF NOT EXISTS mold_cavity text,
ADD COLUMN IF NOT EXISTS ocr_confidence_score numeric,
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'needs_review',
ADD COLUMN IF NOT EXISTS ocr_raw_data jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tracking_photo_url text;

-- Add index for efficient searching by tool number and vendor ID
CREATE INDEX IF NOT EXISTS idx_product_items_tool_number ON public.product_items(tool_number) WHERE tool_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_items_vendor_id ON public.product_items(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_items_verification_status ON public.product_items(verification_status);

-- Add constraint for verification status values
ALTER TABLE public.product_items 
ADD CONSTRAINT check_verification_status 
CHECK (verification_status IN ('manual_verified', 'auto_detected', 'needs_review'));

COMMENT ON COLUMN public.product_items.tool_number IS 'Molded-in tool number like T-20788-1A';
COMMENT ON COLUMN public.product_items.vendor_id IS 'Molded-in vendor ID number like 32293';
COMMENT ON COLUMN public.product_items.manufacturing_date IS 'Parsed manufacturing date from circular dials';
COMMENT ON COLUMN public.product_items.plastic_code IS 'Recycling code like "2 HDPE"';
COMMENT ON COLUMN public.product_items.mold_cavity IS 'Specific mold cavity or shift information';
COMMENT ON COLUMN public.product_items.ocr_confidence_score IS 'AI confidence score 0-1 for OCR results';
COMMENT ON COLUMN public.product_items.verification_status IS 'Status of OCR data verification';
COMMENT ON COLUMN public.product_items.ocr_raw_data IS 'Raw OCR results for debugging and analysis';
COMMENT ON COLUMN public.product_items.tracking_photo_url IS 'URL to photo used for OCR processing';