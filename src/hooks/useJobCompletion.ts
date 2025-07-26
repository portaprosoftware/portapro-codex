import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface JobConsumableAllocation {
  locationId: string;
  locationName: string;
  quantity: number;
}

interface CompleteJobData {
  jobId: string;
  status: 'completed';
  consumableAllocations?: Record<string, JobConsumableAllocation[]>; // consumableId -> location allocations
  notes?: string;
}

export function useJobCompletion() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CompleteJobData) => {
      // Update job status
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ 
          status: data.status,
          actual_completion_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', data.jobId);

      if (jobError) throw jobError;

      // If consumable allocations provided, update location stock
      if (data.consumableAllocations) {
        for (const [consumableId, allocations] of Object.entries(data.consumableAllocations)) {
          for (const allocation of allocations) {
            // First get current quantity, then update
            const { data: currentStock } = await supabase
              .from('consumable_location_stock')
              .select('quantity')
              .eq('consumable_id', consumableId)
              .eq('storage_location_id', allocation.locationId)
              .single();

            if (currentStock) {
              const newQuantity = Math.max(0, currentStock.quantity - allocation.quantity);
              const { error: stockError } = await supabase
                .from('consumable_location_stock')
                .update({ 
                  quantity: newQuantity,
                  updated_at: new Date().toISOString()
                })
                .eq('consumable_id', consumableId)
                .eq('storage_location_id', allocation.locationId);

              if (stockError) {
                console.error('Failed to update location stock:', stockError);
                // Continue with other updates even if one fails
              }
            }
          }
        }

        // Sync total stock after location updates
        for (const consumableId of Object.keys(data.consumableAllocations)) {
          await supabase.rpc('sync_consumable_total_from_locations', {
            consumable_uuid: consumableId
          });
        }
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Job Completed",
        description: "Job status updated and consumable stock adjusted",
      });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-consumables'] });
      queryClient.invalidateQueries({ queryKey: ['consumable-location-stock'] });
      queryClient.invalidateQueries({ queryKey: ['consumables'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete job: " + error.message,
        variant: "destructive",
      });
      console.error('Job completion error:', error);
    }
  });
}