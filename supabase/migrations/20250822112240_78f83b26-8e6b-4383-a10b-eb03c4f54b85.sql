-- Update existing quote items with proper pricing and product names
UPDATE quote_items 
SET 
  unit_price = p.default_price_per_day,
  line_total = p.default_price_per_day * quote_items.quantity * quote_items.rental_duration_days,
  product_name = p.name
FROM products p
WHERE quote_items.product_id = p.id 
  AND (quote_items.unit_price = 0 OR quote_items.line_total = 0 OR quote_items.product_name LIKE 'Product %');