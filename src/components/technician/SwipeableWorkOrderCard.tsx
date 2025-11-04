import React, { useState, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Wrench,
  ChevronRight,
  X,
  Pause
} from 'lucide-react';

interface SwipeableWorkOrderCardProps {
  workOrder: any;
  onSwipeComplete: () => void;
  onSwipeDefer: () => void;
  onTap: () => void;
}

export const SwipeableWorkOrderCard: React.FC<SwipeableWorkOrderCardProps> = ({ 
  workOrder, 
  onSwipeComplete,
  onSwipeDefer,
  onTap
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipingRight, setIsSwipingRight] = useState(false);
  const [isSwipingLeft, setIsSwipingLeft] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 120; // pixels to trigger action

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const isOverdue = workOrder.due_date && new Date(workOrder.due_date) < new Date();
  const canComplete = workOrder.status === 'in_progress';
  const canDefer = ['open', 'awaiting_parts', 'in_progress'].includes(workOrder.status);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      const offset = eventData.deltaX;
      
      // Only allow meaningful swipes based on status
      if (offset > 0 && canComplete) {
        // Swipe right - complete
        setSwipeOffset(Math.min(offset, 200));
        setIsSwipingRight(offset > 50);
      } else if (offset < 0 && canDefer) {
        // Swipe left - defer
        setSwipeOffset(Math.max(offset, -200));
        setIsSwipingLeft(offset < -50);
      }
    },
    onSwiped: (eventData) => {
      const offset = eventData.deltaX;
      
      if (offset > SWIPE_THRESHOLD && canComplete) {
        // Trigger complete action
        onSwipeComplete();
      } else if (offset < -SWIPE_THRESHOLD && canDefer) {
        // Trigger defer action
        onSwipeDefer();
      }
      
      // Reset
      setSwipeOffset(0);
      setIsSwipingRight(false);
      setIsSwipingLeft(false);
    },
    onTap: () => {
      onTap();
    },
    trackMouse: true,
    trackTouch: true,
    delta: 10,
  });

  const swipeProgress = Math.abs(swipeOffset) / SWIPE_THRESHOLD;
  const backgroundColor = isSwipingRight 
    ? `rgba(34, 197, 94, ${Math.min(swipeProgress * 0.3, 0.3)})` 
    : isSwipingLeft 
    ? `rgba(251, 146, 60, ${Math.min(swipeProgress * 0.3, 0.3)})`
    : 'transparent';

  return (
    <div className="relative overflow-hidden rounded-lg" ref={cardRef}>
      {/* Swipe Action Backgrounds */}
      {canComplete && (
        <div 
          className="absolute inset-y-0 left-0 flex items-center justify-start pl-6 pointer-events-none z-0"
          style={{
            width: '100%',
            background: 'linear-gradient(to right, rgba(34, 197, 94, 0.2), transparent)',
            opacity: isSwipingRight ? Math.min(swipeProgress, 1) : 0,
            transition: 'opacity 0.1s',
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <span className="text-lg font-bold text-green-700">Complete</span>
          </div>
        </div>
      )}

      {canDefer && (
        <div 
          className="absolute inset-y-0 right-0 flex items-center justify-end pr-6 pointer-events-none z-0"
          style={{
            width: '100%',
            background: 'linear-gradient(to left, rgba(251, 146, 60, 0.2), transparent)',
            opacity: isSwipingLeft ? Math.min(swipeProgress, 1) : 0,
            transition: 'opacity 0.1s',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-orange-700">Defer</span>
            <Pause className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      )}

      {/* Swipeable Card */}
      <div
        {...handlers}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none',
          backgroundColor,
        }}
        className="relative z-10"
      >
        <Card className="overflow-hidden">
          {/* Priority Bar */}
          <div className={`h-2 ${getPriorityColor(workOrder.priority)}`} />

          {/* Card Content */}
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-foreground">
                    {workOrder.work_order_number || `WO-${workOrder.id.slice(-8)}`}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {getPriorityLabel(workOrder.priority)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Wrench className="h-4 w-4" />
                  {workOrder.asset_name || workOrder.asset_id}
                </p>
              </div>

              {isOverdue && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue
                </Badge>
              )}
            </div>

            {/* Description */}
            {workOrder.description && (
              <p className="text-sm text-foreground line-clamp-2">
                {workOrder.description}
              </p>
            )}

            {/* Due Date */}
            {workOrder.due_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Due: {new Date(workOrder.due_date).toLocaleDateString()}</span>
              </div>
            )}

            {/* Out of Service Badge */}
            {workOrder.out_of_service && (
              <Badge variant="destructive" className="w-full justify-center py-2 text-sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Vehicle Out of Service
              </Badge>
            )}

            {/* Swipe Hint */}
            {(canComplete || canDefer) && (
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                {canComplete && (
                  <span className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 rotate-180" />
                    Swipe right to complete
                  </span>
                )}
                {canDefer && (
                  <span className="flex items-center gap-1">
                    Swipe left to defer
                    <ChevronRight className="h-3 w-3" />
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
