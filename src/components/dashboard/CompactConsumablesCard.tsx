import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/StatCard';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';


export const CompactConsumablesCard: React.FC = () => {
  const { hasAdminAccess } = useUserRole();
  const navigate = useNavigate();

  const { data: totalStats } = useQuery({
    queryKey: ['dashboard-consumable-location-stats-compact'],
    queryFn: async () => {
      // Get all location stock entries with their low stock thresholds and consumable reorder thresholds
      const { data: locationStockData, error } = await supabase
        .from('consumable_location_stock')
        .select(`
          id,
          quantity,
          low_stock_threshold,
          consumable:consumables!inner(
            id,
            name,
            is_active,
            reorder_threshold
          )
        `);
      
      if (error) throw error;
      
      // Filter for active consumables only
      const activeLocationStocks = locationStockData.filter(
        (stock: any) => stock.consumable?.is_active === true
      );
      
      // Count low stock locations using either location threshold or global reorder threshold
      const lowStockLocations = activeLocationStocks.filter((stock: any) => {
        const locationThreshold = stock.low_stock_threshold;
        const globalThreshold = stock.consumable?.reorder_threshold || 0;
        
        // Use location threshold if set, otherwise fall back to global threshold
        const effectiveThreshold = (locationThreshold && locationThreshold > 0) 
          ? locationThreshold 
          : globalThreshold;
        
        return effectiveThreshold > 0 && stock.quantity <= effectiveThreshold;
      }).length;
      
      // Get unique consumable count
      const uniqueConsumableIds = new Set(
        activeLocationStocks.map((stock: any) => stock.consumable?.id)
      );
      
      return { 
        lowStockCount: lowStockLocations, 
        totalItems: uniqueConsumableIds.size,
        totalLocationStocks: activeLocationStocks.length 
      };
    },
    enabled: hasAdminAccess
  });

  // Don't show widget for non-admin users
  if (!hasAdminAccess) {
    return null;
  }

  const stockedPercentage = totalStats && totalStats.totalItems > 0 
    ? ((totalStats.totalItems - totalStats.lowStockCount) / totalStats.totalItems * 100)
    : 100;

  return (
    <StatCard
      title="Consumables Alert"
      value={totalStats?.lowStockCount || 0}
      emoji="🧻"
      gradientFrom="#ea580c"
      gradientTo="#c2410c"
      iconBg="#ea580c"
      subtitle={`${stockedPercentage.toFixed(0)}% properly stocked`}
      subtitleColor="text-orange-600"
      delay={700}
      clickable
      onClick={() => navigate('/consumables')}
    />
  );
};