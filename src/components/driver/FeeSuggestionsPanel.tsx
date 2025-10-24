import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Info, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface SuggestedFee {
  id: string;
  name: string;
  amount: number;
  reason: string;
  auto_added: boolean;
  unit_id?: string;
  unit_number?: string;
}

interface FeeSuggestionsPanelProps {
  suggestedFees: SuggestedFee[];
  onApply: (feeIds: string[]) => void;
  onDismiss: (feeId: string, reason: string) => void;
}

export const FeeSuggestionsPanel: React.FC<FeeSuggestionsPanelProps> = ({
  suggestedFees,
  onApply,
  onDismiss,
}) => {
  const [appliedFees, setAppliedFees] = useState<Set<string>>(
    new Set(suggestedFees.filter(f => f.auto_added).map(f => f.id))
  );
  const [showDismissDialog, setShowDismissDialog] = useState(false);
  const [dismissingFee, setDismissingFee] = useState<SuggestedFee | null>(null);
  const [dismissReason, setDismissReason] = useState('');

  const toggleFee = (feeId: string) => {
    const fee = suggestedFees.find(f => f.id === feeId);
    if (!fee) return;

    if (appliedFees.has(feeId)) {
      // Removing a fee - require reason
      setDismissingFee(fee);
      setShowDismissDialog(true);
    } else {
      // Adding a fee
      setAppliedFees(prev => new Set([...prev, feeId]));
    }
  };

  const confirmDismiss = () => {
    if (dismissingFee) {
      setAppliedFees(prev => {
        const newSet = new Set(prev);
        newSet.delete(dismissingFee.id);
        return newSet;
      });
      onDismiss(dismissingFee.id, dismissReason);
      setShowDismissDialog(false);
      setDismissingFee(null);
      setDismissReason('');
    }
  };

  const handleApply = () => {
    onApply(Array.from(appliedFees));
  };

  const totalAmount = suggestedFees
    .filter(f => appliedFees.has(f.id))
    .reduce((sum, f) => sum + f.amount, 0);

  const autoAddedCount = suggestedFees.filter(f => f.auto_added).length;
  const suggestedCount = suggestedFees.length - autoAddedCount;

  if (suggestedFees.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No fee suggestions for this service report
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Fee Suggestions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Review and apply suggested fees based on service conditions
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto-Added Fees */}
          {autoAddedCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold">
                  Auto-Added ({autoAddedCount})
                </Badge>
                <span className="text-xs text-muted-foreground">Pre-checked for review</span>
              </div>
              {suggestedFees
                .filter(f => f.auto_added)
                .map(fee => (
                  <FeeItem
                    key={fee.id}
                    fee={fee}
                    checked={appliedFees.has(fee.id)}
                    onToggle={() => toggleFee(fee.id)}
                  />
                ))}
            </div>
          )}

          {/* Suggested Fees */}
          {suggestedCount > 0 && (
            <div className="space-y-2">
              {autoAddedCount > 0 && <div className="border-t my-3" />}
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">Suggested ({suggestedCount})</Badge>
                <span className="text-xs text-muted-foreground">Review and select</span>
              </div>
              {suggestedFees
                .filter(f => !f.auto_added)
                .map(fee => (
                  <FeeItem
                    key={fee.id}
                    fee={fee}
                    checked={appliedFees.has(fee.id)}
                    onToggle={() => toggleFee(fee.id)}
                  />
                ))}
            </div>
          )}

          {/* Total */}
          <div className="border-t pt-3 flex items-center justify-between">
            <span className="font-semibold">Total Suggested:</span>
            <span className="text-lg font-bold text-green-600">
              ${totalAmount.toFixed(2)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAppliedFees(new Set())}
              className="flex-1"
            >
              Clear All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAppliedFees(new Set(suggestedFees.map(f => f.id)))}
              className="flex-1"
            >
              Select All
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600"
            >
              Apply ({appliedFees.size})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dismiss Reason Dialog */}
      <Dialog open={showDismissDialog} onOpenChange={setShowDismissDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Fee</DialogTitle>
            <DialogDescription>
              Why are you removing "{dismissingFee?.name}"? (Optional but recommended for audit trail)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={dismissReason}
            onChange={(e) => setDismissReason(e.target.value)}
            placeholder="e.g., Customer dispute, not applicable, etc."
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowDismissDialog(false);
                setDismissingFee(null);
                setDismissReason('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmDismiss}>Confirm Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface FeeItemProps {
  fee: SuggestedFee;
  checked: boolean;
  onToggle: () => void;
}

const FeeItem: React.FC<FeeItemProps> = ({ fee, checked, onToggle }) => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
      <Checkbox checked={checked} onCheckedChange={onToggle} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{fee.name}</span>
              {fee.auto_added && (
                <Badge variant="secondary" className="text-xs">Auto</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fee.reason}
              {fee.unit_number && ` · Unit ${fee.unit_number}`}
            </p>
          </div>
          <Badge variant="outline" className="text-sm font-bold shrink-0">
            ${fee.amount.toFixed(2)}
          </Badge>
        </div>
      </div>
    </div>
  );
};
