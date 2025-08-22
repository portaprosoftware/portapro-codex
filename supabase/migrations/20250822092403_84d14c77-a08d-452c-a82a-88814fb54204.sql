-- Add missing columns to invoices table for enhanced invoice functionality
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_frequency TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS additional_fees_description TEXT;

-- Add missing columns to invoice_items table
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS unit_of_measure TEXT DEFAULT 'each';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON invoices(job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON invoices(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Add status tracking columns to jobs and quotes tables
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS invoiced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS converted_to_invoice_at TIMESTAMP WITH TIME ZONE;

-- Create trigger to automatically update job invoice status
CREATE OR REPLACE FUNCTION update_job_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.job_id IS NOT NULL THEN
    UPDATE jobs 
    SET invoiced_at = NEW.created_at 
    WHERE id = NEW.job_id AND invoiced_at IS NULL;
  END IF;
  
  IF NEW.quote_id IS NOT NULL THEN
    UPDATE quotes 
    SET converted_to_invoice_at = NEW.created_at 
    WHERE id = NEW.quote_id AND converted_to_invoice_at IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invoice creation
DROP TRIGGER IF EXISTS trigger_update_source_invoice_status ON invoices;
CREATE TRIGGER trigger_update_source_invoice_status
  AFTER INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_job_invoice_status();