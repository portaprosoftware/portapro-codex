import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useMemo, useEffect } from 'react';

interface UnifiedStockData {
  product_id: string;
  master_stock: number;
  individual_items: {
    total_tracked: number;
    available: number;
    assigned: number;
    maintenance: number;
    reserved: number;
  };
  bulk_stock: {
    pool_available: number;
    reserved: number;
  };
  totals: {
    physically_available: number;
    total_reserved: number;
    in_maintenance: number;
    tracked_individual: number;
    bulk_pool: number;
  };
  tracking_method: 'individual' | 'bulk' | 'hybrid' | 'none';
  last_updated: string;
}

interface StockAdjustmentResult {
  success: boolean;
  old_stock: number;
  new_stock: number;
  quantity_change: number;
  individual_items_count: number;
  bulk_pool: number;
  reason: string;
  error?: string;
}

// Hash function for efficient change detection
const hashStockData = (data: UnifiedStockData): string => {
  return JSON.stringify({
    master_stock: data.master_stock,
    individual_available: data.individual_items.available,
    individual_assigned: data.individual_items.assigned,
    individual_maintenance: data.individual_items.maintenance,
    bulk_pool: data.totals.bulk_pool,
    bulk_reserved: data.bulk_stock.reserved,
    physically_available: data.totals.physically_available,
  });
};

export const useUnifiedStockManagement = (productId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get unified stock data with change detection
  const { data: stockData, isLoading, error } = useQuery({
    queryKey: ['unified-stock', productId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unified_product_stock', {
        product_uuid: productId
      });
      
      if (error) throw error;
      
      return data as unknown as UnifiedStockData;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
    enabled: !!productId,
  });

  // Real-time subscriptions for stock-related changes
  useEffect(() => {
    if (!productId) return;

    const channel = supabase
      .channel(`unified-stock-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productId}`
        },
        () => {
          console.log('Products table changed for:', productId);
          queryClient.invalidateQueries({ queryKey: ['unified-stock', productId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_items',
          filter: `product_id=eq.${productId}`
        },
        () => {
          console.log('Product items changed for:', productId);
          queryClient.invalidateQueries({ queryKey: ['unified-stock', productId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment_assignments',
          filter: `product_id=eq.${productId}`
        },
        () => {
          console.log('Equipment assignments changed for product:', productId);
          queryClient.invalidateQueries({ queryKey: ['unified-stock', productId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_adjustments',
          filter: `product_id=eq.${productId}`
        },
        () => {
          console.log('Stock adjustments changed for:', productId);
          queryClient.invalidateQueries({ queryKey: ['unified-stock', productId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, queryClient]);

  // Memoized hash for change detection
  const stockHash = useMemo(() => {
    return stockData ? hashStockData(stockData) : null;
  }, [stockData]);

  // Adjust master stock mutation
  const adjustMasterStock = useMutation({
    mutationFn: async ({
      quantityChange,
      reason,
      notes
    }: {
      quantityChange: number;
      reason: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc('adjust_master_stock', {
        product_uuid: productId,
        quantity_change: quantityChange,
        reason_text: reason,
        notes_text: notes || null
      });
      
      if (error) throw error;
      
      return data as unknown as StockAdjustmentResult;
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Stock Adjusted Successfully",
          description: `${result.reason}: ${result.quantity_change > 0 ? '+' : ''}${result.quantity_change} units. New total: ${result.new_stock}`,
        });
        
        // Invalidate and refetch related queries
        queryClient.invalidateQueries({ queryKey: ['unified-stock', productId] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product-items', productId] });
        queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      } else {
        toast({
          title: "Stock Adjustment Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('Stock adjustment error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to adjust stock",
        variant: "destructive",
      });
    },
  });

  // Sync stock totals mutation (for fixing data inconsistencies)
  const syncStockTotals = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('sync_product_stock_totals');
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: (result: any) => {
      if (result.success) {
        toast({
          title: "Stock Synchronization Complete",
          description: `Fixed ${result.products_fixed} products with inconsistent data`,
        });
        
        // Refresh all inventory data
        queryClient.invalidateQueries({ queryKey: ['unified-stock'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
    },
    onError: (error: any) => {
      console.error('Stock sync error:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to synchronize stock data",
        variant: "destructive",
      });
    },
  });

  // Calculated values for UI display
  const calculations = useMemo(() => {
    if (!stockData) return null;

    const {
      master_stock,
      individual_items,
      totals
    } = stockData;

    return {
      // Progress bar calculations
      availablePercentage: master_stock > 0 ? (totals.physically_available / master_stock) * 100 : 0,
      assignedPercentage: master_stock > 0 ? (individual_items.assigned / master_stock) * 100 : 0,
      maintenancePercentage: master_stock > 0 ? (individual_items.maintenance / master_stock) * 100 : 0,
      bulkPoolPercentage: master_stock > 0 ? (totals.bulk_pool / master_stock) * 100 : 0,
      
      // Status indicators
      isLowStock: totals.physically_available < (master_stock * 0.2), // Less than 20%
      isCriticalStock: totals.physically_available < (master_stock * 0.1), // Less than 10%
      hasInconsistency: (individual_items.total_tracked + totals.bulk_pool) !== master_stock,
      
      // Breakdown display
      statusBreakdown: [
        { 
          label: 'Available Individual', 
          count: individual_items.available, 
          color: 'bg-green-500',
          description: 'Individual items ready for assignment'
        },
        { 
          label: 'Bulk Pool', 
          count: totals.bulk_pool, 
          color: 'bg-blue-500',
          description: 'Units available for bulk assignment'
        },
        { 
          label: 'On Job', 
          count: individual_items.assigned, 
          color: 'bg-yellow-500',
          description: 'Individual items assigned to jobs'
        },
        { 
          label: 'Maintenance', 
          count: individual_items.maintenance, 
          color: 'bg-red-500',
          description: 'Individual items under maintenance'
        },
        { 
          label: 'Reserved', 
          count: individual_items.reserved, 
          color: 'bg-purple-500',
          description: 'Individual items reserved for specific use'
        }
      ].filter(item => item.count > 0)
    };
  }, [stockData]);

  return {
    // Data
    stockData,
    calculations,
    stockHash,
    
    // Loading states
    isLoading,
    error,
    isAdjusting: adjustMasterStock.isPending,
    isSyncing: syncStockTotals.isPending,
    
    // Actions
    adjustMasterStock: adjustMasterStock.mutate,
    syncStockTotals: syncStockTotals.mutate,
    
    // Quick access to key metrics
    masterStock: stockData?.master_stock || 0,
    physicallyAvailable: stockData?.totals.physically_available || 0,
    totalReserved: stockData?.totals.total_reserved || 0,
    inMaintenance: stockData?.totals.in_maintenance || 0,
    trackingMethod: stockData?.tracking_method || 'none',
    
    // Status checks
    isConsistent: !calculations?.hasInconsistency,
    needsAttention: calculations?.isLowStock || calculations?.hasInconsistency,
  };
};