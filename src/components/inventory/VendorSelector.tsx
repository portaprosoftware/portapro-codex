import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VendorSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const VendorSelector: React.FC<VendorSelectorProps> = ({
  value,
  onValueChange,
}) => {
  // For now, return a simple select without vendors since the table doesn't exist
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select vendor" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">No vendor</SelectItem>
      </SelectContent>
    </Select>
  );
};