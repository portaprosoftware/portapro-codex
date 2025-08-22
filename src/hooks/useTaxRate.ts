import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveTaxRate, normalizeZip, CompanySettingsTaxConfig } from '@/lib/tax';

interface UseTaxRateParams {
  zip?: string | null;
  state?: string | null;
}

export function useTaxRate({ zip, state }: UseTaxRateParams) {
  const zip5 = normalizeZip(zip);
  const stateUp = state || undefined;

  return useQuery({
    queryKey: ['tax-rate', zip5, stateUp],
    queryFn: async () => {
      // Fetch company settings
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('tax_enabled, tax_method, flat_tax_rate, state_tax_rates, zip_tax_overrides')
        .single();
      if (settingsError) throw settingsError;

      // Fetch zip rate from table if zip is present
      let tableZipRate: number | null = null;
      if (zip5) {
        const { data: tr } = await supabase
          .from('tax_rates')
          .select('tax_rate')
          .eq('zip_code', zip5)
          .maybeSingle();
        tableZipRate = tr ? Number(tr.tax_rate) : null;
      }

      const rate = resolveTaxRate(settings as CompanySettingsTaxConfig, {
        zip: zip5,
        state: stateUp || undefined,
        tableZipRate,
      });

      return { rate, settings: settings as CompanySettingsTaxConfig };
    },
  });
}
