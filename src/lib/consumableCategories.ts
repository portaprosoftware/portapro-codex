// Centralized consumable category configuration

export interface ConsumableCategory {
  value: string;
  label: string;
  description: string;
  examples: string[];
}

export const CONSUMABLE_CATEGORIES: ConsumableCategory[] = [
  {
    value: 'guest_essentials',
    label: 'Guest Essentials',
    description: 'Items directly used by customers for sanitation and hygiene',
    examples: ['Toilet paper', 'Hand sanitizer refills', 'Soap cartridges', 'Disposable seat covers', 'Paper towels']
  },
  {
    value: 'deodorizers_fragrances',
    label: 'Deodorizers & Fragrances',
    description: 'Odor control and air freshening products',
    examples: ['Urinal cakes', 'Air freshener blocks', 'Deodorizer pucks', 'Odor control blocks', 'Scented cartridges']
  },
  {
    value: 'cleaning_sanitization',
    label: 'Cleaning & Sanitization',
    description: 'Cleaning agents, disinfectants, and sanitizing supplies',
    examples: ['Disinfectant wipes', 'Surface cleaner', 'Floor cleaner', 'Bleach tablets', 'Sanitizing solutions']
  },
  {
    value: 'paper_products',
    label: 'Paper Products',
    description: 'Disposable paper and plastic items',
    examples: ['Bulk trash bags', 'Feminine hygiene disposal bags', 'Paper towel rolls', 'Napkins', 'Tissue paper']
  },
  {
    value: 'replacement_parts_hardware',
    label: 'Replacement Parts & Hardware',
    description: 'Mechanical parts and hardware for unit maintenance',
    examples: ['Hoses', 'Faucet nozzles', 'Dispenser brackets', 'Seals and gaskets', 'Locks and latches']
  },
  {
    value: 'ppe_safety_supplies',
    label: 'PPE & Safety Supplies',
    description: 'Personal protective equipment and safety items',
    examples: ['Nitrile gloves', 'Face masks', 'Safety vests', 'Goggles', 'Hand protection']
  },
  {
    value: 'bulk_stock',
    label: 'Bulk Stock',
    description: 'Large-format or bulk-pack items not billed per piece',
    examples: ['Bulk cleaning chemicals', 'Industrial paper products', 'Wholesale supplies', 'Bulk containers']
  },
  {
    value: 'maintenance',
    label: 'Maintenance',
    description: 'General maintenance supplies and tools',
    examples: ['Lubricants', 'Adhesives', 'Basic tools', 'Repair materials', 'Maintenance chemicals']
  },
  {
    value: 'office_supplies',
    label: 'Office Supplies',
    description: 'Administrative and office materials',
    examples: ['Forms', 'Clipboards', 'Pens', 'Tags', 'Documentation supplies']
  },
  {
    value: 'tools',
    label: 'Tools',
    description: 'Hand tools and equipment',
    examples: ['Wrenches', 'Pliers', 'Measuring tools', 'Testing equipment', 'Installation tools']
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Miscellaneous items that don\'t fit other categories',
    examples: ['Specialty items', 'Seasonal supplies', 'Custom products', 'Unique materials']
  }
];

// Legacy category mapping for data migration
export const LEGACY_CATEGORY_MAPPING: Record<string, string> = {
  'deodorizer': 'deodorizers_fragrances',
  'cleaning_supplies': 'cleaning_sanitization',
  'sanitizer': 'cleaning_sanitization',
  'chemicals': 'cleaning_sanitization',
  'paper_products': 'paper_products',
  'Parts': 'replacement_parts_hardware',
  'Safety Equipment': 'ppe_safety_supplies',
  'Cleaning Supplies': 'cleaning_sanitization',
  'Chemicals': 'cleaning_sanitization',
  'Paper Products': 'paper_products',
  'Maintenance': 'maintenance',
  'Office Supplies': 'office_supplies',
  'Tools': 'tools',
  'Other': 'other'
};

// Helper function to get category by value
export const getCategoryByValue = (value: string): ConsumableCategory | undefined => {
  return CONSUMABLE_CATEGORIES.find(cat => cat.value === value);
};

// Helper function to get category label by value
export const getCategoryLabel = (value: string): string => {
  const category = getCategoryByValue(value);
  return category ? category.label : value;
};

// Helper function to get all category values
export const getCategoryValues = (): string[] => {
  return CONSUMABLE_CATEGORIES.map(cat => cat.value);
};

// Helper function to get all category labels
export const getCategoryLabels = (): string[] => {
  return CONSUMABLE_CATEGORIES.map(cat => cat.label);
};