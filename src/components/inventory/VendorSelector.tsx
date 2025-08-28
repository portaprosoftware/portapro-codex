
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VendorSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const VendorSelector: React.FC<VendorSelectorProps> = ({
  value,
  onValueChange,
}) => {
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading vendors..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select vendor" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">No vendor</SelectItem>
        {vendors?.map((vendor) => (
          <SelectItem key={vendor.id} value={vendor.id}>
            {vendor.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
