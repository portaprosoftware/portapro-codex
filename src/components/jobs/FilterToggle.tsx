import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff } from 'lucide-react';

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
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        {showCancelled ? (
          <Eye className="w-4 h-4 text-gray-600" />
        ) : (
          <EyeOff className="w-4 h-4 text-gray-600" />
        )}
        <span className="text-sm text-gray-700">
          Cancelled Jobs {cancelledCount > 0 && `(${cancelledCount})`}
        </span>
      </div>
      <Switch
        checked={showCancelled}
        onCheckedChange={onToggle}
      />
    </div>
  );
};