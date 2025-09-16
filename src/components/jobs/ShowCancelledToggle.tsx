import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EyeOff, Eye } from 'lucide-react';

interface ShowCancelledToggleProps {
  showCancelled: boolean;
  onToggle: (show: boolean) => void;
  cancelledCount?: number;
  size?: 'sm' | 'default';
}

export const ShowCancelledToggle: React.FC<ShowCancelledToggleProps> = ({
  showCancelled,
  onToggle,
  cancelledCount = 0,
  size = 'sm'
}) => {
  return (
    <Button
      variant="outline"
      size={size}
      onClick={() => onToggle(!showCancelled)}
      className="ml-2"
    >
      {showCancelled ? (
        <>
          <EyeOff className="w-4 h-4 mr-2" />
          Hide Cancelled
        </>
      ) : (
        <>
          <Eye className="w-4 h-4 mr-2" />
          Show Cancelled
          {cancelledCount > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {cancelledCount}
            </Badge>
          )}
        </>
      )}
    </Button>
  );
};