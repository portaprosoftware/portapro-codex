import React, { useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CONSUMABLE_CATEGORIES, getCategoryByValue } from '@/lib/consumableCategories';

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
  const [open, setOpen] = useState(false);
  
  // Sort categories alphabetically by label
  const sortedCategories = [...CONSUMABLE_CATEGORIES].sort((a, b) => 
    a.label.localeCompare(b.label)
  );

  const selectedCategory = getCategoryByValue(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCategory ? (
            <div className="flex flex-col items-start">
              <span>{selectedCategory.label}</span>
              <span className="text-xs text-muted-foreground truncate">
                {selectedCategory.description}
              </span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search categories..." className="h-9" />
          <CommandEmpty>No category found.</CommandEmpty>
          <CommandList className="max-h-[300px]">
            <CommandGroup>
              {sortedCategories.map((category) => (
                <CommandItem
                  key={category.value}
                  value={category.label}
                  onSelect={() => {
                    onValueChange(category.value);
                    setOpen(false);
                  }}
                  className="p-3"
                >
                  <div className="flex flex-col w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.label}</span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === category.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {category.description}
                    </span>
                    <div className="text-xs text-muted-foreground mt-1 opacity-75">
                      Examples: {category.examples.slice(0, 3).join(', ')}
                      {category.examples.length > 3 && '...'}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};