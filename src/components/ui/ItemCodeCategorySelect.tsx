import React from 'react';
import { useItemCodeCategories } from '@/hooks/useCompanySettings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface ItemCodeCategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const ItemCodeCategorySelect: React.FC<ItemCodeCategorySelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select category"
}) => {
  const { categories, isLoading } = useItemCodeCategories();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading categories...</span>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        No item code categories configured
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {categories.map((category) => (
          <SelectItem key={category.value} value={category.value} className="py-3">
            <div className="flex flex-col items-start w-full">
              <span className="font-medium">{category.label}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {category.description}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};