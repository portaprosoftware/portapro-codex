-- Add custom_deposit_percentage column to customers table
ALTER TABLE customers 
ADD COLUMN custom_deposit_percentage numeric(5,2) NULL;

COMMENT ON COLUMN customers.custom_deposit_percentage IS 'Customer-specific deposit percentage that overrides company default. NULL means use company default.';