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
  returnEquipment?: boolean; // Whether to automatically return assigned equipment
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

      // Handle equipment assignments - return equipment if requested
      if (data.returnEquipment !== false) { // Default to true if not specified
        // Get all equipment assignments for this job
        const { data: equipmentAssignments, error: equipmentError } = await supabase
          .from('equipment_assignments')
          .select('*')
          .eq('job_id', data.jobId)
          .in('status', ['assigned', 'delivered', 'in_service']);

        if (equipmentError) {
          console.error('Failed to fetch equipment assignments:', equipmentError);
        } else if (equipmentAssignments && equipmentAssignments.length > 0) {
          // Handle specific item assignments (product_item_id is set)
          const specificAssignments = equipmentAssignments.filter(ea => ea.product_item_id);
          if (specificAssignments.length > 0) {
            const itemIds = specificAssignments.map(ea => ea.product_item_id);
            
            // Update product items status back to available
            const { error: itemUpdateError } = await supabase
              .from('product_items')
              .update({ 
                status: 'available',
                updated_at: new Date().toISOString()
              })
              .in('id', itemIds);

            if (itemUpdateError) {
              console.error('Failed to update product item status:', itemUpdateError);
            }
          }

          // Update all equipment assignments to returned status
          const { error: assignmentUpdateError } = await supabase
            .from('equipment_assignments')
            .update({ 
              status: 'returned',
              return_date: new Date().toISOString().split('T')[0], // Set return date to today
              updated_at: new Date().toISOString()
            })
            .eq('job_id', data.jobId)
            .in('status', ['assigned', 'delivered', 'in_service']);

          if (assignmentUpdateError) {
            console.error('Failed to update equipment assignments:', assignmentUpdateError);
          }
        }
      }

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
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['product-items'] });
      queryClient.invalidateQueries({ queryKey: ['unified-stock'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
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