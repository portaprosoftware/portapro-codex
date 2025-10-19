import React from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MobileFilterPanelProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  activeFiltersCount: number;
  children: React.ReactNode;
}

export const MobileFilterPanel: React.FC<MobileFilterPanelProps> = ({
  isOpen,
  onToggle,
  activeFiltersCount,
  children
}) => {
  return (
    <div className="md:hidden">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between mb-2"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
