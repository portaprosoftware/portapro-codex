import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePadlockOperations } from '@/hooks/usePadlockOperations';
import { useUser } from '@clerk/clerk-react';

interface PadlockManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemCode: string;
  currentlyPadlocked: boolean;
  supportsPadlock: boolean;
}

export const PadlockManagementDialog: React.FC<PadlockManagementDialogProps> = ({
  isOpen,
  onClose,
  itemId,
  itemCode,
  currentlyPadlocked,
  supportsPadlock,
}) => {
  const { user } = useUser();
  const { performOperation, isLoading } = usePadlockOperations();
  const [padlockType, setPadlockType] = useState<'standard' | 'combination' | 'keyed'>('standard');
  const [codeReference, setCodeReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!user?.id) return;

    const operation = currentlyPadlocked ? 'unlock' : 'padlock';
    
    performOperation({
      itemId,
      operationType: operation,
      userId: user.id,
      padlockType: operation === 'padlock' ? padlockType : undefined,
      codeReference: operation === 'padlock' && codeReference ? codeReference : undefined,
      notes: notes || undefined,
    });

    onClose();
    // Reset form
    setPadlockType('standard');
    setCodeReference('');
    setNotes('');
  };

  if (!supportsPadlock) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Padlock Not Supported</DialogTitle>
            <DialogDescription>
              This product type does not support external padlocks.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {currentlyPadlocked ? 'Unlock Unit' : 'Apply Padlock'}
          </DialogTitle>
          <DialogDescription>
            {currentlyPadlocked 
              ? `Remove padlock from unit ${itemCode}`
              : `Apply padlock to unit ${itemCode}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!currentlyPadlocked && (
            <>
              <div className="space-y-2">
                <Label htmlFor="padlock-type">Padlock Type</Label>
                <Select value={padlockType} onValueChange={(value: any) => setPadlockType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select padlock type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="combination">Combination</SelectItem>
                    <SelectItem value="keyed">Keyed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code-reference">Code/Key Reference</Label>
                <Input
                  id="code-reference"
                  type="password"
                  placeholder="Enter combination or key reference"
                  value={codeReference}
                  onChange={(e) => setCodeReference(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes about this operation"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading 
                ? 'Processing...' 
                : currentlyPadlocked 
                  ? 'Unlock Unit' 
                  : 'Apply Padlock'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};