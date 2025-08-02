import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

interface PinInventoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  coordinateId: string;
  pinName: string;
}

export function PinInventoryModal({ isOpen, onOpenChange, coordinateId, pinName }: PinInventoryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Assign Inventory to "{pinName}"
          </DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <p className="text-muted-foreground">
            Inventory assignment functionality will be implemented here.
            Pin ID: {coordinateId}
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}