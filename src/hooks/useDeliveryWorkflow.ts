import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationId } from './useOrganizationId';

export const useVerifyDelivery = () => {
  const queryClient = useQueryClient();
  const { orgId } = useOrganizationId();

  return useMutation({
    mutationFn: async ({ deliveryId, verifiedBy }: { deliveryId: string; verifiedBy: string }) => {
      if (!orgId) throw new Error('Organization context is required');
      const { data, error } = await supabase.rpc('verify_delivery', {
        delivery_uuid: deliveryId,
        verified_by_user: verifiedBy,
        org_id: orgId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-tank-deliveries', orgId] });
      toast.success('Delivery verified successfully');
    },
    onError: (error) => {
      toast.error('Failed to verify delivery: ' + error.message);
    },
  });
};

export const useLockDelivery = () => {
  const queryClient = useQueryClient();
  const { orgId } = useOrganizationId();

  return useMutation({
    mutationFn: async ({ deliveryId, lockedBy }: { deliveryId: string; lockedBy: string }) => {
      if (!orgId) throw new Error('Organization context is required');
      const { data, error } = await supabase.rpc('lock_delivery_to_ledger', {
        delivery_uuid: deliveryId,
        locked_by_user: lockedBy,
        org_id: orgId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-tank-deliveries', orgId] });
      toast.success('Delivery locked to ledger');
    },
    onError: (error) => {
      toast.error('Failed to lock delivery: ' + error.message);
    },
  });
};
