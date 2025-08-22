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
      let externalZipRate: number | null = null;
      if (zip5) {
        const zipVariants = [zip5, zip5.replace(/^0+/, '')].filter((z, i, arr) => z && arr.indexOf(z) === i) as string[];
        const { data: tr } = await supabase
          .from('tax_rates')
          .select('tax_rate, zip_code')
          .in('zip_code', zipVariants)
          .limit(1)
          .maybeSingle();
        tableZipRate = tr ? Number(tr.tax_rate) : null;

        // TaxJar fallback lookup
        try {
          const { data: tjData, error: tjError } = await supabase.functions.invoke('taxjar-rate', {
            body: { zip: zip5, state: stateUp || undefined },
          });
          if (!tjError && tjData?.rateDecimal != null) {
            externalZipRate = Number(tjData.rateDecimal);
          }
        } catch (e) {
          console.warn('[useTaxRate] TaxJar lookup failed', e);
        }
      }

      const effectiveZipRate = tableZipRate ?? externalZipRate;

      const rate = resolveTaxRate(settings as CompanySettingsTaxConfig, {
        zip: zip5,
        state: stateUp || undefined,
        tableZipRate: effectiveZipRate,
      });

      // Debug logs to help trace 0.00% issues
      console.log('[useTaxRate] inputs', { zip, normalized: zip5, state, stateUp });
      console.log('[useTaxRate] settings', settings);
      console.log('[useTaxRate] tableZipRate', tableZipRate, 'externalZipRate', externalZipRate);
      console.log('[useTaxRate] resolved rate (decimal)', rate);

      return { rate, settings: settings as CompanySettingsTaxConfig };
    },
  });
}
