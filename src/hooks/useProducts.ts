import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from '@/hooks/useOrganizationId';

export interface Product {
  id: string;
  name: string;
  stock_total: number;
  image_url?: string;
  organization_id?: string;
}

export function useProducts() {
  const { orgId } = useOrganizationId();

  return useQuery<Product[]>({
    queryKey: ['products', orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('Organization ID required');

      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_total, image_url, organization_id')
        .eq('organization_id', orgId)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });
}