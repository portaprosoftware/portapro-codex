import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AvailabilityUnit {
  item_id: string;
  item_code: string;
  status: string;
  attributes?: {
    color?: string | null;
    size?: string | null;
    material?: string | null;
    winterized?: boolean | null;
  } | null;
}

interface AvailabilityResult {
  available: number;
  total: number;
  method: string;
  individual_items?: AvailabilityUnit[];
}

export function useAvailabilityEngine(
  productId?: string,
  startDate?: string,
  endDate?: string | null,
  filterAttributes?: Record<string, any> | null
) {
  const start = startDate || undefined;
  const end = endDate || startDate || undefined;
  const filters = filterAttributes && Object.values(filterAttributes).some((v) => v !== undefined && v !== '' && v !== null)
    ? filterAttributes
    : null;

  return useQuery<AvailabilityResult>({
    queryKey: ['availability', productId, start, end, filters],
    queryFn: async () => {
      if (!productId || !start) return { available: 0, total: 0, method: 'none', individual_items: [] };
      const { data, error } = await supabase.rpc('get_product_availability_enhanced', {
        product_type_id: productId,
        start_date: start,
        end_date: end || start,
        filter_attributes: filters,
      });
      if (error) throw error;
      const avail: any = data || {};
      return {
        available: Number(avail.available) || 0,
        total: Number(avail.total) || 0,
        method: String(avail.method || 'stock_total'),
        individual_items: Array.isArray(avail.individual_items) ? avail.individual_items as AvailabilityUnit[] : [],
      };
    },
    enabled: !!productId && !!start,
  });
}
