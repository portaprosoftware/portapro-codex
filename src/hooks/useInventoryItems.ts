import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from '@/hooks/useOrganizationId';
import { useToast } from '@/hooks/use-toast';

export interface InventoryItem {
  id: string;
  product_id: string;
  serial_number?: string;
  qr_code?: string;
  status?: string;
  current_location?: string;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
}

export function useInventoryItems(filters?: { status?: string; productId?: string }) {
  const { orgId } = useOrganizationId();

  return useQuery<any[]>({
    queryKey: ['inventory-items', orgId, filters],
    queryFn: async () => {
      if (!orgId) throw new Error('Organization ID required');

      let query = supabase
        .from('inventory_items' as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });
}

export function useInventoryItem(itemId: string | null) {
  const { orgId } = useOrganizationId();

  return useQuery<any | null>({
    queryKey: ['inventory-item', itemId, orgId],
    queryFn: async () => {
      if (!itemId || !orgId) return null;

      const { data, error } = await supabase
        .from('inventory_items' as any)
        .select('*')
        .eq('id', itemId)
        .eq('organization_id', orgId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!itemId && !!orgId,
  });
}

export function useCreateInventoryItem() {
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (itemData: Omit<InventoryItem, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!orgId) throw new Error('Organization ID required');

      const { data, error } = await supabase
        .from('inventory_items' as any)
        .insert({
          ...itemData,
          organization_id: orgId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items', orgId] });
      toast({
        title: 'Success',
        description: 'Inventory item created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create inventory item: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateInventoryItem() {
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...itemData }: Partial<InventoryItem> & { id: string }) => {
      if (!orgId) throw new Error('Organization ID required');

      const { data, error } = await supabase
        .from('inventory_items' as any)
        .update(itemData)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items', orgId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-item', data?.id, orgId] });
      toast({
        title: 'Success',
        description: 'Inventory item updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update inventory item: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteInventoryItem() {
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!orgId) throw new Error('Organization ID required');

      const { error } = await supabase
        .from('inventory_items' as any)
        .delete()
        .eq('id', itemId)
        .eq('organization_id', orgId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items', orgId] });
      toast({
        title: 'Success',
        description: 'Inventory item deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete inventory item: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
