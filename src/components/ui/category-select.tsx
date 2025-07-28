import React from 'react';
import { CONSUMABLE_CATEGORIES, getCategoryByValue } from '@/lib/consumableCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select category"
}) => {
  // Sort categories alphabetically by label
  const sortedCategories = [...CONSUMABLE_CATEGORIES].sort((a, b) => 
    a.label.localeCompare(b.label)
  );

  const selectedCategory = getCategoryByValue(value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {selectedCategory ? (
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">{selectedCategory.label}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                {selectedCategory.description}
              </span>
            </div>
          ) : (
            placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {sortedCategories.map((category) => (
          <SelectItem key={category.value} value={category.value} className="py-3">
            <div className="flex flex-col items-start w-full">
              <span className="font-medium">{category.label}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {category.description}
              </span>
              <div className="text-xs text-muted-foreground mt-1 opacity-75">
                Examples: {category.examples.slice(0, 3).join(', ')}
                {category.examples.length > 3 && '...'}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};