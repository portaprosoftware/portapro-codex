-- Update Photos & Visual Records categories to use gradient blue color instead of gray
UPDATE document_categories
SET color = 'linear-gradient(135deg, #3B82F6, #2563EB)'
WHERE name IN ('Vehicle Photos', 'Job Site Photos', 'Compliance Photos');