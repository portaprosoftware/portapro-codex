import React from 'react';
import { Button } from '@/components/ui/button';
import { EyeOff, Eye } from 'lucide-react';

interface FilterToggleProps {
  showCancelled: boolean;
  onToggle: (show: boolean) => void;
  cancelledCount?: number;
}

export const FilterToggle: React.FC<FilterToggleProps> = ({
  showCancelled,
  onToggle,
  cancelledCount = 0
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onToggle(!showCancelled)}
      className="ml-2"
    >
      {showCancelled ? (
        <>
          <EyeOff className="w-4 h-4 mr-1" />
          Hide Cancelled
        </>
      ) : (
        <>
          <Eye className="w-4 h-4 mr-1" />
          Show Cancelled {cancelledCount > 0 && `(${cancelledCount})`}
        </>
      )}
    </Button>
  );
};