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
    on_job: number;
    reserved: number;
  };
  bulk_stock: {
    pool_available: number;
    on_job: number;
    reserved: number;
    location_breakdown?: any[];
  };
  totals: {
    physically_available: number;
    on_job_today: number;
    reserved_future: number;
    in_maintenance: number;
    tracked_individual: number;
    bulk_pool: number;
  };
  tracking_method: 'individual' | 'bulk' | 'hybrid' | 'none';
  generated_at: string;
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
    on_job_today: data.totals.on_job_today,
    reserved_future: data.totals.reserved_future,
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

  // Convert Bulk to Tracked Mutation
  const convertBulkToTracked = useMutation({
    mutationFn: async (quantity: number) => {
      const { data, error } = await supabase.rpc('convert_bulk_to_tracked', {
        product_uuid: productId,
        convert_qty: quantity
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Conversion Successful",
        description: "Successfully converted bulk units to individually tracked items",
      });
      queryClient.invalidateQueries({ queryKey: ['unified-stock', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-items', productId] });
    },
    onError: (error: any) => {
      console.error('Error converting bulk to tracked:', error);
      toast({
        title: "Conversion Failed",
        description: error.message || 'Failed to convert units',
        variant: "destructive",
      });
    },
  });

  // Add New Tracked Inventory Mutation
  const addTrackedInventory = useMutation({
    mutationFn: async (quantity: number) => {
      const { data, error } = await supabase.rpc('add_tracked_inventory', {
        product_uuid: productId,
        add_qty: quantity
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Inventory Added",
        description: "Successfully added new tracked inventory items",
      });
      queryClient.invalidateQueries({ queryKey: ['unified-stock', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-items', productId] });
    },
    onError: (error: any) => {
      console.error('Error adding tracked inventory:', error);
      toast({
        title: "Add Inventory Failed",
        description: error.message || 'Failed to add tracked inventory',
        variant: "destructive",
      });
    },
  });

  // Adjust master stock mutation (for bulk operations only)
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
      // First try RPC for atomic server-side update
      try {
        const { data, error } = await (supabase.rpc as any)('adjust_master_stock', {
          product_uuid: productId,
          quantity_change: quantityChange,
          reason: reason,
          notes: notes || null
        });
        if (error) throw error;
        return data as unknown as StockAdjustmentResult;
      } catch (rpcError: any) {
        console.warn('adjust_master_stock RPC failed, falling back to direct update:', rpcError?.message || rpcError);
        // Fallback client-side update (best-effort)
        // 1) Fetch product details
        const { data: product, error: productErr } = await supabase
          .from('products')
          .select('id, stock_total, default_storage_location_id')
          .eq('id', productId)
          .maybeSingle();
        if (productErr || !product) {
          throw rpcError || productErr;
        }

        const oldStock = product.stock_total || 0;
        const newStock = Math.max(0, oldStock + quantityChange);
        const locationId = product.default_storage_location_id as string | null;

        // 2) Update location stock if we know a default location
        if (locationId) {
          const { data: locRow } = await supabase
            .from('product_location_stock')
            .select('id, quantity')
            .eq('product_id', productId)
            .eq('storage_location_id', locationId)
            .maybeSingle();

          const newLocQty = Math.max(0, (locRow?.quantity || 0) + quantityChange);

          if (locRow?.id) {
            await supabase
              .from('product_location_stock')
              .update({ quantity: newLocQty })
              .eq('id', locRow.id);
          } else {
            await supabase
              .from('product_location_stock')
              .insert({
                product_id: productId,
                storage_location_id: locationId,
                quantity: newLocQty,
              });
          }
        }

        // 3) Update product master total as a mirror value
        await supabase
          .from('products')
          .update({ stock_total: newStock })
          .eq('id', productId);

        // 4) Try to log adjustment (ignore errors if table not present)
        try {
          await supabase.from('stock_adjustments').insert({
            product_id: productId,
            quantity_change: quantityChange,
            reason,
            notes: notes || null,
          });
        } catch {}

        return {
          success: true,
          old_stock: oldStock,
          new_stock: newStock,
          quantity_change: quantityChange,
          individual_items_count: 0,
          bulk_pool: 0,
          reason,
        } as StockAdjustmentResult;
      }
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
      bulk_stock,
      totals
    } = stockData;

    return {
      // Progress bar calculations
      availablePercentage: master_stock > 0 ? (totals.physically_available / master_stock) * 100 : 0,
      onJobPercentage: master_stock > 0 ? (totals.on_job_today / master_stock) * 100 : 0,
      reservedPercentage: master_stock > 0 ? (totals.reserved_future / master_stock) * 100 : 0,
      maintenancePercentage: master_stock > 0 ? (individual_items.maintenance / master_stock) * 100 : 0,
      bulkPoolPercentage: master_stock > 0 ? (totals.bulk_pool / master_stock) * 100 : 0,
      
      // Status indicators
      isLowStock: totals.physically_available < (master_stock * 0.2), // Less than 20%
      isCriticalStock: totals.physically_available < (master_stock * 0.1), // Less than 10%
      hasInconsistency: (individual_items.total_tracked + totals.bulk_pool) !== master_stock,
      
      // Breakdown display - always show all statuses
      statusBreakdown: [
        { 
          label: 'Available', 
          count: totals.physically_available, 
          color: 'bg-green-500',
          description: 'Units ready for deployment'
        },
        { 
          label: 'On Job (Today)', 
          count: totals.on_job_today, 
          color: 'bg-yellow-500',
          description: 'Units currently deployed on jobs'
        },
        { 
          label: 'Reserved (Future)', 
          count: totals.reserved_future, 
          color: 'bg-blue-500',
          description: 'Units reserved for future jobs'
        },
        { 
          label: 'Maintenance', 
          count: individual_items.maintenance, 
          color: 'bg-orange-500',
          description: 'Individual items under maintenance'
        },
        { 
          label: 'Bulk Pool', 
          count: bulk_stock.pool_available, 
          color: 'bg-purple-500',
          description: 'Available units in bulk inventory'
        }
      ]
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
    isConverting: convertBulkToTracked.isPending,
    isAddingTracked: addTrackedInventory.isPending,
    
    // Actions
    adjustMasterStock: adjustMasterStock.mutate,
    syncStockTotals: syncStockTotals.mutate,
    convertBulkToTracked: convertBulkToTracked.mutate,
    addTrackedInventory: addTrackedInventory.mutate,
    
    // Quick access to key metrics
    masterStock: stockData?.master_stock || 0,
    physicallyAvailable: stockData?.totals.physically_available || 0,
    bulkPoolAvailable: stockData?.bulk_stock?.pool_available || 0,
    bulkPool: stockData?.totals.bulk_pool || 0,
    trackedAvailable: stockData?.individual_items.available || 0,
    onJobToday: stockData?.totals.on_job_today || 0,
    reservedFuture: stockData?.totals.reserved_future || 0,
    inMaintenance: stockData?.totals.in_maintenance || 0,
    trackingMethod: stockData?.tracking_method === 'hybrid' ? 'Hybrid' : stockData?.tracking_method || 'none',
    
    // Status checks
    isConsistent: !calculations?.hasInconsistency,
  };
};