import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ban } from 'lucide-react';

interface CancelJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  jobNumber?: string;
  customerName?: string;
  isLoading?: boolean;
}

const CANCELLATION_REASONS = [
  'Customer Request',
  'Weather Conditions',
  'Access Issues',
  'Equipment Problems',
  'Emergency Prioritization',
  'Site Not Ready',
  'Other'
];

export const CancelJobModal: React.FC<CancelJobModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  jobNumber,
  customerName,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const finalReason = reason === 'Other' ? customReason : reason;
    if (finalReason.trim()) {
      onConfirm(finalReason.trim());
      // Reset form
      setReason('');
      setCustomReason('');
    }
  };

  const handleClose = () => {
    setReason('');
    setCustomReason('');
    onClose();
  };

  const isFormValid = reason && (reason !== 'Other' || customReason.trim());

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-[500px] z-[60]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Ban className="w-5 h-5" />
            Cancel Job
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this job? This action will mark the job as cancelled and cannot be undone.
            {jobNumber && customerName && (
              <>
                <br /><br />
                <strong>Job:</strong> {jobNumber}
                <br />
                <strong>Customer:</strong> {customerName}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cancellation-reason">Cancellation Reason</Label>
            <Select value={reason} onValueChange={setReason} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason for cancellation" />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((reasonOption) => (
                  <SelectItem key={reasonOption} value={reasonOption}>
                    {reasonOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {reason === 'Other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Custom Reason</Label>
              <Input
                id="custom-reason"
                placeholder="Please specify the reason for cancellation"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                disabled={isLoading}
                maxLength={255}
              />
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isLoading}>
            Keep Job
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isFormValid || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Cancelling...' : 'Cancel Job'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};