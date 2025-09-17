import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, User, Save, X } from 'lucide-react';
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

        <div className="py-4">
          <div className="space-y-2">
            {orderedDrivers.map((driver, index) => (
              <Card key={driver.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveDriverUp(index)}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveDriverDown(index)}
                      disabled={index === orderedDrivers.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  
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

                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
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