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
import { usePadlockSecurity } from '@/hooks/usePadlockSecurity';
import { SecurityIncidentDialog } from './SecurityIncidentDialog';
import { useUser } from '@clerk/clerk-react';
import { Shield, Eye, EyeOff } from 'lucide-react';

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
  const { accessPadlockCode, isAccessingCode } = usePadlockSecurity();
  const [padlockType, setPadlockType] = useState<'standard' | 'combination' | 'keyed'>('standard');
  const [codeReference, setCodeReference] = useState('');
  const [notes, setNotes] = useState('');
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [showCodeReference, setShowCodeReference] = useState(false);
  const [accessedCode, setAccessedCode] = useState('');

  const handleAccessCode = () => {
    if (!user?.id) return;
    
    accessPadlockCode({
      itemId,
      reason: 'Service access request'
    }, {
      onSuccess: (data: any) => {
        if (data?.success) {
          setAccessedCode(data.code_reference || '');
          setShowCodeReference(true);
        }
      }
    });
  };

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
    setShowCodeReference(false);
    setAccessedCode('');
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
          {/* Security Actions */}
          {currentlyPadlocked && (
            <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Secure Access</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAccessCode}
                  disabled={isAccessingCode}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {isAccessingCode ? 'Accessing...' : 'View Padlock Code'}
                </Button>
                
                {showCodeReference && accessedCode && (
                  <div className="p-3 bg-white rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Code Reference:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCodeReference(false)}
                      >
                        <EyeOff className="h-3 w-3" />
                      </Button>
                    </div>
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {accessedCode}
                    </code>
                    <p className="text-xs text-gray-500 mt-1">
                      Access logged for security audit
                    </p>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSecurityDialog(true)}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Report Security Incident
                </Button>
              </div>
            </div>
          )}

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

        <SecurityIncidentDialog
          isOpen={showSecurityDialog}
          onClose={() => setShowSecurityDialog(false)}
          itemId={itemId}
          itemCode={itemCode}
        />
      </DialogContent>
    </Dialog>
  );
};