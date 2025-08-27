import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AvailabilityUnit {
  item_id: string;
  item_code: string;
  status: string;
  is_available?: boolean;
  attributes?: {
    color?: string | null;
    size?: string | null;
    material?: string | null;
    winterized?: boolean | null;
  } | null;
}

interface DailyAvailability {
  date: string;
  bulk_available: number;
  bulk_assigned: number;
  tracked_available: number;
  tracked_assigned: number;
  total_available: number;
  conflicts: Array<{
    assignment_id: string;
    job_number?: string;
    customer_name?: string;
    item_id?: string;
    status: string;
  }>;
}

interface AvailabilitySummary {
  min_available: number;
  max_available: number;
  avg_available: number;
  bulk_pool: number;
  tracked_units: number;
}

interface AvailabilityResult {
  available: number;
  total: number;
  method: string;
  individual_items?: AvailabilityUnit[];
  daily_breakdown?: DailyAvailability[];
  summary?: AvailabilitySummary;
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
    queryKey: ['availability-enhanced', productId, start, end, filters],
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
        individual_items: Array.isArray(avail.individual_items) ? (avail.individual_items as AvailabilityUnit[]) : [],
        daily_breakdown: Array.isArray(avail.daily_breakdown) ? (avail.daily_breakdown as DailyAvailability[]) : [],
        summary: typeof avail.summary === 'object' && avail.summary !== null ? (avail.summary as AvailabilitySummary) : undefined,
      };
    },
    enabled: !!productId && !!start,
  });
}