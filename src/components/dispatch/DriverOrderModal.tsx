import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, User, Save, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DriverOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: any[];
  onSaveOrder: (orderedDrivers: any[]) => void;
}

export const DriverOrderModal: React.FC<DriverOrderModalProps> = ({
  isOpen,
  onClose,
  drivers,
  onSaveOrder
}) => {
  const [orderedDrivers, setOrderedDrivers] = useState(drivers);

  useEffect(() => {
    setOrderedDrivers(drivers);
  }, [drivers]);

  const moveDriverUp = (index: number) => {
    if (index === 0) return;
    const items = Array.from(orderedDrivers);
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    setOrderedDrivers(items);
  };

  const moveDriverDown = (index: number) => {
    if (index === orderedDrivers.length - 1) return;
    const items = Array.from(orderedDrivers);
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    setOrderedDrivers(items);
  };

  const alphabetizeByFirstName = () => {
    const sorted = [...orderedDrivers].sort((a, b) => {
      const nameA = a.first_name.toLowerCase();
      const nameB = b.first_name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
    setOrderedDrivers(sorted);
  };

  const alphabetizeByLastName = () => {
    const sorted = [...orderedDrivers].sort((a, b) => {
      const nameA = a.last_name.toLowerCase();
      const nameB = b.last_name.toLowerCase();
      return nameA.localeCompare(nameB);
    });
    setOrderedDrivers(sorted);
  };

  const moveToFirst = (index: number) => {
    const items = Array.from(orderedDrivers);
    const [driver] = items.splice(index, 1);
    items.unshift(driver);
    setOrderedDrivers(items);
  };

  const moveToLast = (index: number) => {
    const items = Array.from(orderedDrivers);
    const [driver] = items.splice(index, 1);
    items.push(driver);
    setOrderedDrivers(items);
  };

  const handleSave = () => {
    onSaveOrder(orderedDrivers);
    onClose();
  };

  const handleCancel = () => {
    setOrderedDrivers(drivers); // Reset to original order
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border sm:max-h-[80vh] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Reorder Drivers
          </DialogTitle>
          <DialogDescription>
            Use the up and down arrows to change the order of drivers in the dispatch view.
          </DialogDescription>
        </DialogHeader>

        <div className="pb-2">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-muted-foreground">Alphabetize:</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={alphabetizeByFirstName} className="flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3" />
                Top
              </Button>
              <Button variant="outline" size="sm" onClick={alphabetizeByLastName} className="flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3" />
                Bottom
              </Button>
            </div>
          </div>
        </div>

        {/* Column Headers */}
        <div className="flex items-center px-3 py-2 bg-muted/30 rounded-md text-xs font-medium text-muted-foreground">
          <span className="flex-1">Driver</span>
          <div className="flex items-center gap-8">
            <span className="w-16 text-center">Up | Down</span>
            <span className="w-20 text-center">Top | Bottom</span>
            <span className="w-12 text-center">Position</span>
          </div>
        </div>

        <div className="py-2">
          <div className="space-y-2">
            {orderedDrivers.map((driver, index) => (
              <Card key={driver.id} className="p-3">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {driver.first_name} {driver.last_name}
                    </div>
                    {driver.phone && (
                      <div className="text-xs text-muted-foreground">
                        {driver.phone}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-8">
                    {/* Single Up/Down Movement */}
                    <div className="flex gap-1 w-16 justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveDriverUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                        title="Move up one position"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveDriverDown(index)}
                        disabled={index === orderedDrivers.length - 1}
                        className="h-6 w-6 p-0"
                        title="Move down one position"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* First/Last Movement */}
                    <div className="flex gap-1 w-20 justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveToFirst(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                        title="Move to first"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveToLast(index)}
                        disabled={index === orderedDrivers.length - 1}
                        className="h-6 w-6 p-0"
                        title="Move to last"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="w-12 flex justify-center">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};