import React from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  value,
  onRemove,
  variant = 'outline',
  className
}) => {
  return (
    <Badge 
      variant={variant} 
      className={cn(
        "flex items-center gap-1 pr-1 pl-3 py-1 text-sm font-medium",
        "hover:bg-muted/80 transition-colors",
        className
      )}
    >
      <span className="truncate">
        <span className="text-muted-foreground">{label}:</span>{' '}
        <span className="text-foreground">{value}</span>
      </span>
      <button
        onClick={onRemove}
        className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
};