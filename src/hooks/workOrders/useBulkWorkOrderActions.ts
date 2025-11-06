import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationId } from '@/hooks/useOrganizationId';

interface BulkStatusChangeParams {
  workOrderIds: string[];
  newStatus: string;
}

interface BulkAssignParams {
  workOrderIds: string[];
  assigneeId: string;
}

interface BulkPriorityChangeParams {
  workOrderIds: string[];
  newPriority: string;
}

interface BulkDeleteParams {
  workOrderIds: string[];
}

export function useBulkWorkOrderActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { orgId } = useOrganizationId();

  const bulkStatusChange = useMutation({
    mutationFn: async ({ workOrderIds, newStatus }: BulkStatusChangeParams) => {
      if (!orgId) throw new Error('Organization required');

      const { data, error } = await supabase
        .from('work_orders')
        .update({ status: newStatus as any })
        .in('id', workOrderIds)
        .eq('organization_id', orgId)
        .select();

      if (error) throw error;

      // Add history entries for each work order
      const historyEntries = workOrderIds.map(id => ({
        work_order_id: id,
        from_status: null,
        to_status: newStatus,
        changed_by: 'system',
        note: `Bulk status change to ${newStatus}`,
        organization_id: orgId
      }));

      await supabase.from('work_order_history').insert(historyEntries);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-work-orders'] });
      toast({
        title: 'Status updated',
        description: `${variables.workOrderIds.length} work order(s) updated to ${variables.newStatus}`,
      });
    },
    onError: (error) => {
      console.error('Bulk status change error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update work order statuses',
        variant: 'destructive',
      });
    },
  });

  const bulkAssign = useMutation({
    mutationFn: async ({ workOrderIds, assigneeId }: BulkAssignParams) => {
      if (!orgId) throw new Error('Organization required');

      const { data, error } = await supabase
        .from('work_orders')
        .update({ 
          assigned_to: assigneeId === 'unassigned' ? null : assigneeId 
        })
        .in('id', workOrderIds)
        .eq('organization_id', orgId)
        .select();

      if (error) throw error;

      // Add history entries
      const historyEntries = workOrderIds.map(id => ({
        work_order_id: id,
        from_status: null,
        to_status: null,
        changed_by: 'system',
        note: assigneeId === 'unassigned' 
          ? 'Bulk unassignment' 
          : `Bulk assignment to technician`,
        organization_id: orgId
      }));

      await supabase.from('work_order_history').insert(historyEntries);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-work-orders'] });
      toast({
        title: 'Assignment updated',
        description: `${variables.workOrderIds.length} work order(s) assigned`,
      });
    },
    onError: (error) => {
      console.error('Bulk assign error:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign work orders',
        variant: 'destructive',
      });
    },
  });

  const bulkPriorityChange = useMutation({
    mutationFn: async ({ workOrderIds, newPriority }: BulkPriorityChangeParams) => {
      if (!orgId) throw new Error('Organization required');

      const { data, error } = await supabase
        .from('work_orders')
        .update({ priority: newPriority as any })
        .in('id', workOrderIds)
        .eq('organization_id', orgId)
        .select();

      if (error) throw error;

      // Add history entries
      const historyEntries = workOrderIds.map(id => ({
        work_order_id: id,
        from_status: null,
        to_status: null,
        changed_by: 'system',
        note: `Bulk priority change to ${newPriority}`,
        organization_id: orgId
      }));

      await supabase.from('work_order_history').insert(historyEntries);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-work-orders'] });
      toast({
        title: 'Priority updated',
        description: `${variables.workOrderIds.length} work order(s) priority changed to ${variables.newPriority}`,
      });
    },
    onError: (error) => {
      console.error('Bulk priority change error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update work order priorities',
        variant: 'destructive',
      });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async ({ workOrderIds }: BulkDeleteParams) => {
      if (!orgId) throw new Error('Organization required');

      // Delete related records first (filter by org for safety)
      await (supabase as any).from('work_order_items').delete().in('work_order_id', workOrderIds).eq('organization_id', orgId);
      await (supabase as any).from('work_order_parts').delete().in('work_order_id', workOrderIds).eq('organization_id', orgId);
      await (supabase as any).from('work_order_labor').delete().in('work_order_id', workOrderIds).eq('organization_id', orgId);
      await (supabase as any).from('work_order_history').delete().in('work_order_id', workOrderIds).eq('organization_id', orgId);
      
      const { data, error } = await supabase
        .from('work_orders')
        .delete()
        .in('id', workOrderIds)
        .eq('organization_id', orgId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-work-orders'] });
      toast({
        title: 'Work orders deleted',
        description: `${variables.workOrderIds.length} work order(s) permanently deleted`,
      });
    },
    onError: (error) => {
      console.error('Bulk delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete work orders',
        variant: 'destructive',
      });
    },
  });

  return {
    bulkStatusChange,
    bulkAssign,
    bulkPriorityChange,
    bulkDelete,
  };
}
