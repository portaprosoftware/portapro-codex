
-- 1) Add a configurable consumable_categories field to company_settings
-- We'll store an array of objects with value (slug), label, description, and examples.
-- This seeds it with your current default categories so the app continues to work immediately.

ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS consumable_categories jsonb NOT NULL DEFAULT
'[
  {
    "value": "guest_essentials",
    "label": "Guest Essentials",
    "description": "Items directly used by customers for sanitation and hygiene",
    "examples": ["Toilet paper", "Hand sanitizer refills", "Soap cartridges", "Disposable seat covers", "Paper towels"]
  },
  {
    "value": "deodorizers_fragrances",
    "label": "Deodorizers & Fragrances",
    "description": "Odor control and air freshening products",
    "examples": ["Urinal cakes", "Air freshener blocks", "Deodorizer pucks", "Odor control blocks", "Scented cartridges"]
  },
  {
    "value": "cleaning_sanitization",
    "label": "Cleaning & Sanitization",
    "description": "Cleaning agents, disinfectants, and sanitizing supplies",
    "examples": ["Disinfectant wipes", "Surface cleaner", "Floor cleaner", "Bleach tablets", "Sanitizing solutions"]
  },
  {
    "value": "paper_products",
    "label": "Paper Products",
    "description": "Disposable paper and plastic items",
    "examples": ["Bulk trash bags", "Feminine hygiene disposal bags", "Paper towel rolls", "Napkins", "Tissue paper"]
  },
  {
    "value": "replacement_parts_hardware",
    "label": "Replacement Parts & Hardware",
    "description": "Mechanical parts and hardware for unit maintenance",
    "examples": ["Hoses", "Faucet nozzles", "Dispenser brackets", "Seals and gaskets", "Locks and latches"]
  },
  {
    "value": "ppe_safety_supplies",
    "label": "PPE & Safety Supplies",
    "description": "Personal protective equipment and safety items",
    "examples": ["Nitrile gloves", "Face masks", "Safety vests", "Goggles", "Hand protection"]
  },
  {
    "value": "bulk_stock",
    "label": "Bulk Stock",
    "description": "Large-format or bulk-pack items not billed per piece",
    "examples": ["Bulk cleaning chemicals", "Industrial paper products", "Wholesale supplies", "Bulk containers"]
  },
  {
    "value": "maintenance",
    "label": "Maintenance",
    "description": "General maintenance supplies and tools",
    "examples": ["Lubricants", "Adhesives", "Basic tools", "Repair materials", "Maintenance chemicals"]
  },
  {
    "value": "office_supplies",
    "label": "Office Supplies",
    "description": "Administrative and office materials",
    "examples": ["Forms", "Clipboards", "Pens", "Tags", "Documentation supplies"]
  },
  {
    "value": "tools",
    "label": "Tools",
    "description": "Hand tools and equipment",
    "examples": ["Wrenches", "Pliers", "Measuring tools", "Testing equipment", "Installation tools"]
  },
  {
    "value": "other",
    "label": "Other",
    "description": "Miscellaneous items that don'\''t fit other categories",
    "examples": ["Specialty items", "Seasonal supplies", "Custom products", "Unique materials"]
  }
]'::jsonb;

-- Ensure existing row(s) get populated with the default (the NOT NULL + DEFAULT above already does this for existing rows)
UPDATE public.company_settings
SET consumable_categories = public.company_settings.consumable_categories
WHERE consumable_categories IS NULL;
