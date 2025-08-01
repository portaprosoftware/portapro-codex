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
      <div 
        title={showTooltip ? "Unit is unlocked and available" : undefined}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-green-100 to-green-200 border border-green-300"
      >
        <Unlock className={cn("h-3 w-3 text-green-700", className)} />
      </div>
    );
  }

  if (isOverdue) {
    return (
      <div 
        title={showTooltip ? "Overdue - padlocked past scheduled pickup" : undefined}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-red-100 to-red-200 border border-red-300 animate-pulse"
      >
        <AlertTriangle className={cn("h-3 w-3 text-red-700", className)} />
      </div>
    );
  }

  // Show different icons based on padlock type with enhanced styling
  switch (padlockType) {
    case 'keyed':
      return (
        <div 
          title={showTooltip ? "Locked with key" : undefined}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 border border-yellow-300"
        >
          <Key className={cn("h-3 w-3 text-yellow-700", className)} />
        </div>
      );
    case 'combination':
      return (
        <div 
          title={showTooltip ? "Locked with combination" : undefined}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300"
        >
          <Hash className={cn("h-3 w-3 text-blue-700", className)} />
        </div>
      );
    default:
      return (
        <div 
          title={showTooltip ? "Locked with standard padlock" : undefined}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 border border-orange-300"
        >
          <Lock className={cn("h-3 w-3 text-orange-700", className)} />
        </div>
      );
  }
};