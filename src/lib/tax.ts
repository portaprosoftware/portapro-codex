// Utilities for tax rate resolution
// Precedence: company_settings.zip_tax_overrides > tax_rates table row > company_settings.state_tax_rates > company_settings.flat_tax_rate

export interface CompanySettingsTaxConfig {
  tax_enabled?: boolean;
  tax_method?: 'flat' | 'state_based' | 'zip_based';
  flat_tax_rate?: number; // decimal (e.g., 0.08)
  state_tax_rates?: Record<string, number>; // e.g., { "NY": 0.08875 }
  zip_tax_overrides?: Record<string, number>; // e.g., { "10001": 0.08875 }
}

export function normalizeZip(zip?: string | null): string | undefined {
  if (!zip) return undefined;
  const cleaned = String(zip).trim();
  if (!cleaned) return undefined;
  // Support ZIP+4 by taking first 5
  return cleaned.slice(0, 5);
}

export function resolveTaxRate(
  settings: CompanySettingsTaxConfig | null | undefined,
  params: { zip?: string; state?: string; tableZipRate?: number | null }
): number {
  const s = settings || {};
  if (s.tax_enabled === false) return 0;

  const zip = normalizeZip(params.zip);
  const state = (params.state || '').toUpperCase();

  // 1) Company-level ZIP override
  const zipOverrides = (s.zip_tax_overrides || {}) as Record<string, number>;
  if (zip && zipOverrides[zip] != null) {
    return Number(zipOverrides[zip]) || 0;
  }

  // 2) tax_rates table exact ZIP match
  if (params.tableZipRate != null) {
    return Number(params.tableZipRate) || 0;
  }

  // 3) State base rate
  const stateRates = (s.state_tax_rates || {}) as Record<string, number>;
  if (state && stateRates[state] != null) {
    return Number(stateRates[state]) || 0;
  }

  // 4) Flat fallback
  if (typeof s.flat_tax_rate === 'number') {
    return Number(s.flat_tax_rate) || 0;
  }

  return 0;
}
