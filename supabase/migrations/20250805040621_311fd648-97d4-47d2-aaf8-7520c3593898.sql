-- Add new customer types to the enum
ALTER TYPE customer_type ADD VALUE 'bars_restaurants';
ALTER TYPE customer_type ADD VALUE 'retail';  
ALTER TYPE customer_type ADD VALUE 'other';