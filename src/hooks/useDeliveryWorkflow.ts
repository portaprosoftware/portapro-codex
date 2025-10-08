import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useVerifyDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deliveryId, verifiedBy }: { deliveryId: string; verifiedBy: string }) => {
      const { data, error } = await supabase.rpc('verify_delivery', {
        delivery_uuid: deliveryId,
        verified_by_user: verifiedBy,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-tank-deliveries'] });
      toast.success('Delivery verified successfully');
    },
    onError: (error) => {
      toast.error('Failed to verify delivery: ' + error.message);
    },
  });
};

export const useLockDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deliveryId, lockedBy }: { deliveryId: string; lockedBy: string }) => {
      const { data, error } = await supabase.rpc('lock_delivery_to_ledger', {
        delivery_uuid: deliveryId,
        locked_by_user: lockedBy,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-tank-deliveries'] });
      toast.success('Delivery locked to ledger');
    },
    onError: (error) => {
      toast.error('Failed to lock delivery: ' + error.message);
    },
  });
};
