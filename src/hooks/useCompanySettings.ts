import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ConsumableCategory } from '@/lib/consumableCategories';
import { CONSUMABLE_CATEGORIES } from '@/lib/consumableCategories';
import { useOrganizationId } from './useOrganizationId';

export interface ItemCodeCategory {
  [key: string]: string; // e.g., {"1000": "Standard Units", "2000": "ADA Units"}
}

export interface CompanySettings {
  id: string;
  company_name?: string;
  item_code_categories: ItemCodeCategory;
  next_item_numbers: { [key: string]: number };
  company_timezone?: string;
  // Dynamic consumable categories array lives here
  consumable_categories?: ConsumableCategory[];
  default_deposit_percentage?: number;
  default_delivery_fee?: number;
  auto_enable_delivery_fee?: boolean;
  // ... other company settings fields
}

export const useCompanySettings = () => {
  const { orgId } = useOrganizationId();

  return useQuery({
    queryKey: ['company-settings', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('Organization ID required');

      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (error) throw error;

      // Bootstrap company_settings if missing
      if (!data) {
        console.info('📋 Bootstrapping company_settings for org:', orgId);
        const { data: inserted, error: upsertErr } = await supabase
          .from('company_settings')
          .upsert({
            organization_id: orgId,
            company_name: 'Company',
            item_code_categories: {},
            next_item_numbers: {},
            company_timezone: 'America/New_York',
            consumable_categories: [],
          }, { onConflict: 'organization_id' })
          .select('*')
          .single();
        
        if (upsertErr) throw upsertErr;
        return {
          ...inserted,
          consumable_categories: Array.isArray(inserted.consumable_categories) ? inserted.consumable_categories as unknown as ConsumableCategory[] : []
        } as CompanySettings;
      }

      return {
        ...data,
        consumable_categories: Array.isArray(data.consumable_categories) ? data.consumable_categories as unknown as ConsumableCategory[] : []
      } as CompanySettings;
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to prevent duplicate queries
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

// New: Dynamic consumable categories hook
export const useConsumableCategories = () => {
  const { data: companySettings, ...rest } = useCompanySettings();
  const customCategories = (companySettings?.consumable_categories as ConsumableCategory[]) || [];
  
  // Always use custom categories if they exist, otherwise show empty (will be initialized on first use)
  const categories = customCategories;
  const hasCustomCategories = customCategories.length > 0;
  const needsInitialization = !hasCustomCategories;
  
  return { categories, hasCustomCategories, needsInitialization, customCategories, ...rest };
};
