import React, { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFuelSuppliers } from '@/hooks/useFuelSuppliers';

interface SupplierAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const SupplierAutocomplete: React.FC<SupplierAutocompleteProps> = ({
  value,
  onValueChange,
}) => {
  const [open, setOpen] = useState(false);
  const { data: suppliers = [] } = useFuelSuppliers();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Select supplier..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search suppliers..." />
          <CommandEmpty>No supplier found.</CommandEmpty>
          <CommandGroup>
            {suppliers.map((supplier) => (
              <CommandItem
                key={supplier.id}
                value={supplier.supplier_name}
                onSelect={(currentValue) => {
                  onValueChange(currentValue === value ? '' : currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === supplier.supplier_name ? "opacity-100" : "opacity-0"
                  )}
                />
                {supplier.supplier_name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
