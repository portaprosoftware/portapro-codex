import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AvailabilityResult {
  available: number;
  total: number;
  method: string;
}

export function useAvailabilityEngine(productId?: string, startDate?: string, endDate?: string | null) {
  const start = startDate || undefined;
  const end = endDate || startDate || undefined;

  return useQuery<AvailabilityResult>({
    queryKey: ['availability', productId, start, end],
    queryFn: async () => {
      if (!productId || !start) return { available: 0, total: 0, method: 'none' };
      const { data, error } = await supabase.rpc('get_product_availability_enhanced', {
        product_type_id: productId,
        start_date: start,
        end_date: end || start,
        filter_attributes: null,
      });
      if (error) throw error;
      const avail = (data as any) || {};
      return {
        available: Number(avail.available) || 0,
        total: Number(avail.total) || 0,
        method: String(avail.method || 'stock_total'),
      };
    },
    enabled: !!productId && !!start,
  });
}
