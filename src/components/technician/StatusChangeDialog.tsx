import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pause, Clock, AlertTriangle } from 'lucide-react';

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (action: 'defer' | 'on_hold' | 'awaiting_parts') => void;
  workOrderNumber: string;
  isProcessing?: boolean;
}

export const StatusChangeDialog: React.FC<StatusChangeDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  workOrderNumber,
  isProcessing = false
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Work Order Status</DialogTitle>
          <DialogDescription>
            Select what to do with {workOrderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <Button
            onClick={() => onConfirm('on_hold')}
            disabled={isProcessing}
            className="w-full h-14 text-base justify-start"
            variant="outline"
          >
            <Pause className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Put On Hold</div>
              <div className="text-xs text-muted-foreground">Temporarily pause this work</div>
            </div>
          </Button>

          <Button
            onClick={() => onConfirm('awaiting_parts')}
            disabled={isProcessing}
            className="w-full h-14 text-base justify-start"
            variant="outline"
          >
            <Clock className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Awaiting Parts</div>
              <div className="text-xs text-muted-foreground">Waiting for parts to arrive</div>
            </div>
          </Button>

          <Button
            onClick={() => onConfirm('defer')}
            disabled={isProcessing}
            className="w-full h-14 text-base justify-start"
            variant="outline"
          >
            <AlertTriangle className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Defer to Later</div>
              <div className="text-xs text-muted-foreground">Move back to open status</div>
            </div>
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
