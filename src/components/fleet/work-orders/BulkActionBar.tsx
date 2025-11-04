import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserCheck, 
  Flag, 
  AlertTriangle, 
  Trash2, 
  Download, 
  X 
} from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onAction: (action: 'status' | 'assign' | 'priority' | 'delete' | 'export') => void;
  onClear: () => void;
  isProcessing?: boolean;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onAction,
  onClear,
  isProcessing = false
}) => {
  if (selectedCount === 0) return null;

  return (
    <Card className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 shadow-lg border-2">
      <div className="flex items-center gap-4 p-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-base px-3 py-1">
            {selectedCount} selected
          </Badge>
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction('status')}
            disabled={isProcessing}
            className="gap-2"
          >
            <Flag className="h-4 w-4" />
            Change Status
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction('assign')}
            disabled={isProcessing}
            className="gap-2"
          >
            <UserCheck className="h-4 w-4" />
            Assign
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction('priority')}
            disabled={isProcessing}
            className="gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Priority
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction('export')}
            disabled={isProcessing}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction('delete')}
            disabled={isProcessing}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>

        <div className="h-8 w-px bg-border" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={isProcessing}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </Card>
  );
};
