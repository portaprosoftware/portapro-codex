import React from 'react';
import { Lock, Unlock, AlertTriangle, Key, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PadlockStatusIconProps {
  currentlyPadlocked: boolean;
  padlockType?: 'standard' | 'combination' | 'keyed' | null;
  isOverdue?: boolean;
  className?: string;
  showTooltip?: boolean;
}

export const PadlockStatusIcon: React.FC<PadlockStatusIconProps> = ({
  currentlyPadlocked,
  padlockType,
  isOverdue = false,
  className,
  showTooltip = true
}) => {
  if (!currentlyPadlocked) {
    return (
      <div title={showTooltip ? "Unit is unlocked and available" : undefined}>
        <Unlock className={cn("h-4 w-4 text-green-600", className)} />
      </div>
    );
  }

  if (isOverdue) {
    return (
      <div title={showTooltip ? "Overdue - padlocked past scheduled pickup" : undefined}>
        <AlertTriangle className={cn("h-4 w-4 text-red-600", className)} />
      </div>
    );
  }

  // Show different icons based on padlock type
  switch (padlockType) {
    case 'keyed':
      return (
        <div title={showTooltip ? "Locked with key" : undefined}>
          <Key className={cn("h-4 w-4 text-yellow-600", className)} />
        </div>
      );
    case 'combination':
      return (
        <div title={showTooltip ? "Locked with combination" : undefined}>
          <Hash className={cn("h-4 w-4 text-blue-600", className)} />
        </div>
      );
    default:
      return (
        <div title={showTooltip ? "Locked with standard padlock" : undefined}>
          <Lock className={cn("h-4 w-4 text-orange-600", className)} />
        </div>
      );
  }
};