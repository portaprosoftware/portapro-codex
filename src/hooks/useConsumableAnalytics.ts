import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ConsumableAnalytics {
  dailyUsageRate: number;
  monthlyConsumptionValue: number;
  turnoverRate: number;
  daysOfSupply: number;
  reorderPoint: number;
  hasRealData: boolean;
}

export const useConsumableAnalytics = (consumableId: string, consumable: any) => {
  return useQuery({
    queryKey: ['consumable-analytics', consumableId],
    queryFn: async (): Promise<ConsumableAnalytics> => {
      // Fetch consumption data from the last 90 days
      const { data: adjustments, error } = await supabase
        .from('consumable_stock_adjustments')
        .select('*')
        .eq('consumable_id', consumableId)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching consumption data:', error);
        return calculateFallbackAnalytics(consumable);
      }

      if (!adjustments || adjustments.length === 0) {
        return calculateFallbackAnalytics(consumable);
      }

      // Calculate real usage metrics
      const consumptionAdjustments = adjustments.filter(adj => 
        adj.adjustment_type === 'usage' || 
        adj.adjustment_type === 'job_consumption' ||
        adj.quantity_change < 0
      );

      if (consumptionAdjustments.length === 0) {
        return calculateFallbackAnalytics(consumable);
      }

      // Calculate daily usage rate from real data
      const totalConsumed = Math.abs(consumptionAdjustments.reduce((sum, adj) => sum + adj.quantity_change, 0));
      const daysWithData = Math.max(1, (Date.now() - new Date(consumptionAdjustments[consumptionAdjustments.length - 1].created_at).getTime()) / (24 * 60 * 60 * 1000));
      const dailyUsageRate = totalConsumed / daysWithData;

      // Calculate days of supply based on current stock and real usage
      const daysOfSupply = dailyUsageRate > 0 ? Math.round(consumable.on_hand_qty / dailyUsageRate) : 0;

      // Calculate reorder point: (daily usage * lead time) + safety stock
      const safetyStockDays = 3; // 3 days safety stock
      const reorderPoint = Math.ceil(dailyUsageRate * (consumable.lead_time_days + safetyStockDays));

      // Monthly consumption value
      const monthlyConsumptionValue = dailyUsageRate * 30 * consumable.unit_cost;

      // Turnover rate (times per year)
      const turnoverRate = dailyUsageRate > 0 ? 365 / (consumable.on_hand_qty / dailyUsageRate) : 0;

      return {
        dailyUsageRate,
        monthlyConsumptionValue,
        turnoverRate,
        daysOfSupply,
        reorderPoint,
        hasRealData: true
      };
    },
    enabled: !!consumableId && !!consumable
  });
};

function calculateFallbackAnalytics(consumable: any): ConsumableAnalytics {
  // Fallback to estimated calculations when no real data is available
  const estimatedDailyUsage = consumable.on_hand_qty / (consumable.target_days_supply || 14);
  const daysOfSupply = consumable.on_hand_qty > 0 ? Math.round(consumable.on_hand_qty / estimatedDailyUsage) : 0;
  const reorderPoint = Math.ceil(estimatedDailyUsage * consumable.lead_time_days);
  const monthlyConsumptionValue = estimatedDailyUsage * 30 * consumable.unit_cost;
  const turnoverRate = estimatedDailyUsage > 0 ? 365 / (consumable.on_hand_qty / estimatedDailyUsage) : 0;

  return {
    dailyUsageRate: estimatedDailyUsage,
    monthlyConsumptionValue,
    turnoverRate,
    daysOfSupply,
    reorderPoint,
    hasRealData: false
  };
}