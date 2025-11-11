import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ConsumableCategory } from '@/lib/consumableCategories';
import { CONSUMABLE_CATEGORIES } from '@/lib/consumableCategories';
import { useOrganizationId } from './useOrganizationId';
import { safeInsert, safeRead } from '@/lib/supabase-helpers';

export interface ItemCodeCategory {
  [key: string]: string; // e.g., {"1000": "Standard Units", "2000": "ADA Units"}
}

export interface CompanySettings {
  id: string;
  company_name?: string;
  company_email?: string;
  company_phone?: string;
  company_street?: string;
  company_city?: string;
  company_state?: string;
  company_zipcode?: string;
  support_email?: string;
  sms_from_number?: string;
  company_logo?: string;
  item_code_categories: ItemCodeCategory;
  next_item_numbers: { [key: string]: number };
  company_timezone?: string;
  consumable_categories?: ConsumableCategory[];
  default_deposit_percentage?: number;
  default_delivery_fee?: number;
  auto_enable_delivery_fee?: boolean;
  enable_sanitation_compliance?: boolean;
}

export const useCompanySettings = () => {
  const { orgId } = useOrganizationId();

  return useQuery({
    queryKey: ['company-settings', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('Organization ID required');

      const { data, error } = await safeRead('company_settings', orgId)
        .select('*')
        .maybeSingle();

      if (error) throw error;

      // Bootstrap company_settings if missing
      if (!data) {
        console.info('📋 Bootstrapping company_settings for org:', orgId);
        
        const bootstrapData = {
          company_name: 'Company',
          item_code_categories: {},
          next_item_numbers: {},
          company_timezone: 'America/New_York',
          consumable_categories: [],
        };
        
        const insertResult = await safeInsert('company_settings', bootstrapData, orgId);
        
        if (insertResult.error) {
          // Handle unique constraint violation (record already exists)
          if (insertResult.error.code === '23505') {
            const { data: existing } = await safeRead('company_settings', orgId)
              .select('*')
              .maybeSingle();
            
            if (existing) {
              return {
                ...existing,
                consumable_categories: Array.isArray(existing.consumable_categories) 
                  ? existing.consumable_categories as unknown as ConsumableCategory[] 
                  : []
              } as CompanySettings;
            }
          }
          throw insertResult.error;
        }
        
        const { data: inserted } = await insertResult.select('*').maybeSingle();
        
        if (!inserted) {
          throw new Error('Failed to bootstrap company_settings');
        }
        
        return {
          ...inserted,
          consumable_categories: Array.isArray(inserted.consumable_categories) 
            ? inserted.consumable_categories as unknown as ConsumableCategory[] 
            : []
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
