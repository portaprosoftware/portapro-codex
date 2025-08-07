
import React, { useMemo } from 'react';
import { CONSUMABLE_CATEGORIES, type ConsumableCategory, getCategoryByValue } from '@/lib/consumableCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConsumableCategories } from '@/hooks/useCompanySettings';

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
  const { categories: dynamicCategories } = useConsumableCategories();

  // Prefer dynamic categories; fallback to static if not available
  const sourceCategories: ConsumableCategory[] = (dynamicCategories && dynamicCategories.length > 0)
    ? dynamicCategories
    : CONSUMABLE_CATEGORIES;

  // Sort categories alphabetically by label
  const sortedCategories = useMemo(
    () => [...sourceCategories].sort((a, b) => a.label.localeCompare(b.label)),
    [sourceCategories]
  );

  const selectedCategory = useMemo(() => {
    // Try dynamic/static search by value
    return sortedCategories.find(c => c.value === value) || getCategoryByValue(value);
  }, [sortedCategories, value]);

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
              {category.examples?.length ? (
                <div className="text-xs text-muted-foreground mt-1 opacity-75">
                  Examples: {category.examples.slice(0, 3).join(', ')}
                  {category.examples.length > 3 && '...'}
                </div>
              ) : null}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
