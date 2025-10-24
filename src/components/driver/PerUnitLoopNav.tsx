import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Check, Circle, AlertCircle } from 'lucide-react';

interface Unit {
  id: string;
  unit_number: string;
  unit_type: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'not_serviced';
}

interface PerUnitLoopNavProps {
  units: Unit[];
  currentUnitIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onJumpTo: (index: number) => void;
  canNavigate: boolean;
}

export const PerUnitLoopNav: React.FC<PerUnitLoopNavProps> = ({
  units,
  currentUnitIndex,
  onPrevious,
  onNext,
  onJumpTo,
  canNavigate,
}) => {
  const currentUnit = units[currentUnitIndex];
  
  const getStatusIcon = (unit: Unit) => {
    switch (unit.status) {
      case 'completed':
        return <Check className="w-3 h-3 text-green-500" />;
      case 'in_progress':
        return <Circle className="w-3 h-3 text-blue-500 fill-blue-500" />;
      case 'not_serviced':
        return <AlertCircle className="w-3 h-3 text-orange-500" />;
      default:
        return <Circle className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg">
      {/* Main Navigation */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevious}
          disabled={currentUnitIndex === 0 || !canNavigate}
          className="text-white hover:bg-white/20"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="text-center flex-1 mx-4">
          <div className="text-sm font-medium">
            Unit {currentUnitIndex + 1} of {units.length}
          </div>
          <div className="text-xs opacity-90 mt-0.5">
            {currentUnit?.unit_number} · {currentUnit?.unit_type}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={currentUnitIndex === units.length - 1 || !canNavigate}
          className="text-white hover:bg-white/20"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {units.map((unit, index) => (
            <button
              key={unit.id}
              onClick={() => canNavigate && onJumpTo(index)}
              disabled={!canNavigate}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                index === currentUnitIndex
                  ? 'bg-white text-primary font-bold scale-110'
                  : unit.status === 'completed'
                  ? 'bg-green-500/30 border border-green-500'
                  : unit.status === 'not_serviced'
                  ? 'bg-orange-500/30 border border-orange-500'
                  : unit.status === 'in_progress'
                  ? 'bg-blue-500/30 border border-blue-500'
                  : 'bg-white/20 border border-white/40'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Status Summary */}
      <div className="px-4 pb-3 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <Check className="w-3 h-3" />
          <span>{units.filter(u => u.status === 'completed').length} done</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>{units.filter(u => u.status === 'not_serviced').length} not serviced</span>
        </div>
        <div className="flex items-center gap-1">
          <Circle className="w-3 h-3" />
          <span>{units.filter(u => !u.status || u.status === 'not_started').length} remaining</span>
        </div>
      </div>
    </div>
  );
};
