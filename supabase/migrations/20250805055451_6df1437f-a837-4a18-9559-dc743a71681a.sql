-- Update one Color attribute to be required for testing
UPDATE product_properties 
SET is_required = true 
WHERE attribute_name = 'Color' 
AND id = '8fb26375-d116-4166-85fb-62626f050132';