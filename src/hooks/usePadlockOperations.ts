import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PadlockOperation {
  itemId: string;
  operationType: 'padlock' | 'unlock';
  userId: string;
  padlockType?: 'standard' | 'combination' | 'keyed';
  codeReference?: string;
  locationCoords?: { lat: number; lng: number };
  notes?: string;
}

export const usePadlockOperations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const performOperation = useMutation({
    mutationFn: async (operation: PadlockOperation) => {
      const locationPoint = operation.locationCoords 
        ? `(${operation.locationCoords.lat},${operation.locationCoords.lng})`
        : null;

      const { data, error } = await supabase.rpc('handle_padlock_operation', {
        item_uuid: operation.itemId,
        operation_type: operation.operationType,
        user_uuid: operation.userId,
        padlock_type_param: operation.padlockType || null,
        code_reference: operation.codeReference || null,
        location_coords: locationPoint,
        notes_param: operation.notes || null
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      const result = data as any;
      if (result?.success) {
        toast({
          title: "Success",
          description: result.message || "Operation completed successfully",
        });
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['product-items'] });
        queryClient.invalidateQueries({ queryKey: ['padlock-activity'] });
        queryClient.invalidateQueries({ queryKey: ['overdue-padlocked-units'] });
      } else {
        toast({
          title: "Error",
          description: result?.error || "Operation failed",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to perform padlock operation",
        variant: "destructive",
      });
    },
  });

  return {
    performOperation: performOperation.mutate,
    isLoading: performOperation.isPending,
  };
};

export const useOverduePadlockedUnits = () => {
  return useQuery({
    queryKey: ['overdue-padlocked-units'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_overdue_padlocked_units');
      if (error) throw error;
      return data;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};

export const usePadlockActivityLog = (itemId: string) => {
  return useQuery({
    queryKey: ['padlock-activity', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('padlock_activity_log')
        .select('*')
        .eq('product_item_id', itemId)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!itemId,
  });
};