import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, UserCheck, Flag, Trash2 } from 'lucide-react';

interface BulkActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'status' | 'assign' | 'priority' | 'delete' | null;
  selectedCount: number;
  onConfirm: (value?: string) => void;
  isProcessing?: boolean;
  technicians?: Array<{ id: string; name: string }>;
}

export const BulkActionsDialog: React.FC<BulkActionsDialogProps> = ({
  open,
  onOpenChange,
  action,
  selectedCount,
  onConfirm,
  isProcessing = false,
  technicians = []
}) => {
  const [selectedValue, setSelectedValue] = useState<string>('');

  const handleConfirm = () => {
    if (action === 'delete' || selectedValue) {
      onConfirm(selectedValue);
      setSelectedValue('');
    }
  };

  const getDialogContent = () => {
    switch (action) {
      case 'status':
        return {
          icon: <Flag className="h-5 w-5 text-primary" />,
          title: 'Change Status',
          description: `Update the status for ${selectedCount} work order${selectedCount !== 1 ? 's' : ''}`,
          content: (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select value={selectedValue} onValueChange={setSelectedValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="ready_for_verification">Ready for Verification</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )
        };
      
      case 'assign':
        return {
          icon: <UserCheck className="h-5 w-5 text-primary" />,
          title: 'Assign Technician',
          description: `Assign ${selectedCount} work order${selectedCount !== 1 ? 's' : ''} to a technician`,
          content: (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Technician</Label>
                <Select value={selectedValue} onValueChange={setSelectedValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {technicians.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )
        };
      
      case 'priority':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
          title: 'Change Priority',
          description: `Update the priority for ${selectedCount} work order${selectedCount !== 1 ? 's' : ''}`,
          content: (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>New Priority</Label>
                <Select value={selectedValue} onValueChange={setSelectedValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )
        };
      
      case 'delete':
        return {
          icon: <Trash2 className="h-5 w-5 text-destructive" />,
          title: 'Delete Work Orders',
          description: `Are you sure you want to delete ${selectedCount} work order${selectedCount !== 1 ? 's' : ''}?`,
          content: (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. All associated data (tasks, parts, labor, history) will be permanently deleted.
              </AlertDescription>
            </Alert>
          )
        };
      
      default:
        return null;
    }
  };

  const content = getDialogContent();
  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            {content.icon}
            <div>
              <DialogTitle>{content.title}</DialogTitle>
              <DialogDescription>{content.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {content.content}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || (action !== 'delete' && !selectedValue)}
            variant={action === 'delete' ? 'destructive' : 'default'}
          >
            {isProcessing ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
