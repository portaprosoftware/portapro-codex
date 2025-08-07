import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ItemCodeCategory {
  [key: string]: string; // e.g., {"1000": "Standard Units", "2000": "ADA Units"}
}

export interface CompanySettings {
  id: string;
  item_code_categories: ItemCodeCategory;
  next_item_numbers: { [key: string]: number };
  // ... other company settings fields
}

export const useCompanySettings = () => {
  return useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data as CompanySettings;
    },
  });
};

export const useItemCodeCategories = () => {
  const { data: companySettings, ...rest } = useCompanySettings();
  
  const categories = companySettings?.item_code_categories || {};
  
  // Convert to array format for easier use in selects
  const categoryOptions = Object.entries(categories).map(([prefix, name]) => ({
    value: prefix,
    label: `${prefix}s - ${name}`,
    description: `Starting from ${prefix}`,
  }));

  return {
    categories: categoryOptions,
    ...rest
  };
};
