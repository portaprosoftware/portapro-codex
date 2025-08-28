import React, { useState } from 'react';
import { useAvailabilityEngine } from '@/hooks/useAvailabilityEngine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface AvailabilityCalendarProps {
  productId: string;
  productName: string;
  requestedQuantity?: number;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  productId,
  productName,
  requestedQuantity = 1,
  onDateSelect,
  className
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get current month availability
  const { data: availability, isLoading } = useAvailabilityEngine(
    productId,
    format(monthStart, 'yyyy-MM-dd'),
    format(monthEnd, 'yyyy-MM-dd')
  );

  // Get next month availability to check for next available date
  const nextMonthStart = addMonths(monthStart, 1);
  const nextMonthEnd = endOfMonth(nextMonthStart);
  const { data: nextMonthAvailability } = useAvailabilityEngine(
    productId,
    format(nextMonthStart, 'yyyy-MM-dd'),
    format(nextMonthEnd, 'yyyy-MM-dd')
  );

  // Build an augmented daily breakdown where conflicts include ALL unavailable units
  const augmentedAvailability = React.useMemo(() => {
    if (!availability?.daily_breakdown) return availability;

    // Collect units that are unavailable for other reasons (not 'available')
    const unavailableUnits = new Map(
      (availability.individual_items || [])
        .filter((u) => u.status && u.status !== 'available')
        .map((u) => [u.item_id, u])
    );

    const augmentedBreakdown = availability.daily_breakdown.map((day) => {
      const existing = day.conflicts || [];
      const existingIds = new Set<string>(
        existing.map((c: any) => c.item_id).filter(Boolean)
      );

      // Candidates are unavailable units not already represented in conflicts
      const candidates = Array.from(unavailableUnits.values()).filter(
        (u) => !existingIds.has(u.item_id)
      );

      const deficit = Math.max(0, (day.tracked_assigned || 0) - existing.length);
      const extras = candidates.slice(0, deficit).map((u) => ({
        assignment_id: `unavailable:${u.item_id}`,
        job_number: 'Unavailable',
        customer_name: u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : 'Unavailable',
        item_id: u.item_id,
        item_code: u.item_code,
        status: u.status || 'unavailable',
      }));

      return { ...day, conflicts: [...existing, ...extras] };
    });

    return { ...availability, daily_breakdown: augmentedBreakdown };
  }, [availability]);

  // Find next available date
  const getNextAvailableDate = () => {
    // Check current month first
    if (availability?.daily_breakdown) {
      for (const day of availability.daily_breakdown) {
        if (day.total_available >= requestedQuantity) {
          return parseISO(day.date);
        }
      }
    }
    
    // Check next month if nothing found in current month
    if (nextMonthAvailability?.daily_breakdown) {
      for (const day of nextMonthAvailability.daily_breakdown) {
        if (day.total_available >= requestedQuantity) {
          return parseISO(day.date);
        }
      }
    }
    
    return null;
  };

  const nextAvailableDate = getNextAvailableDate();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const getAvailabilityForDate = (date: Date) => {
    if (!augmentedAvailability?.daily_breakdown) return null;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return augmentedAvailability.daily_breakdown.find(day => day.date === dateStr);
  };

  const getAvailabilityStatus = (available: number, requested: number) => {
    if (available >= requested) return 'available';
    if (available > 0) return 'partial';
    return 'unavailable';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-gradient-green text-white border-green-500';
      case 'partial':
        return 'bg-gradient-orange text-white border-orange-500';
      case 'unavailable':
        return 'bg-gradient-red text-white border-red-500';
      default:
        return 'bg-gradient-secondary text-white border-gray-500';
    }
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-gradient-green text-white border-green-500 font-bold';
      case 'partial':
        return 'bg-gradient-orange text-white border-orange-500 font-bold';
      case 'unavailable':
        return 'bg-gradient-red text-white border-red-500 font-bold';
      default:
        return 'bg-gradient-secondary text-white border-gray-500 font-bold';
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Availability Calendar
        </CardTitle>
        <CardDescription>
          Visual calendar showing daily availability for {productName}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Next Available Date Chip */}
        {nextAvailableDate && (
          <div className="flex justify-center items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Next available: {format(nextAvailableDate, 'MMM d')}
            </span>
            <Badge variant="outline" className="bg-gradient-green text-white border-green-500">
              {requestedQuantity}+ units
            </Badge>
          </div>
        )}

        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h3 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-600">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Loading calendar...
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map(date => {
              const dayAvailability = getAvailabilityForDate(date);
              const available = dayAvailability?.total_available || 0;
              const status = getAvailabilityStatus(available, requestedQuantity);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isCurrentDay = isToday(date);

              return (
                <Button
                  key={date.toISOString()}
                  variant="ghost"
                  onClick={() => handleDateClick(date)}
                  className={cn(
                    "relative h-16 p-2 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 border border-gray-300 hover:from-gray-200 hover:to-gray-300",
                    isSelected && "ring-2 ring-blue-500",
                    isCurrentDay && "ring-2 ring-blue-400"
                  )}
                >
                  <span className="text-sm font-bold mb-1">{format(date, 'd')}</span>
                  {dayAvailability && (
                     <Badge variant="outline" className={cn("text-sm px-1 py-0", getBadgeColor(status))}>
                       Available: {available}
                     </Badge>
                  )}
                  {isCurrentDay && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </Button>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-green text-white border border-green-500 rounded flex items-center justify-center text-xs font-bold">✓</div>
            <span>Available ({requestedQuantity}+ units)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-orange text-white border border-orange-500 rounded flex items-center justify-center text-xs font-bold">~</div>
            <span>Partial (1-{requestedQuantity - 1} units)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-red text-white border border-red-500 rounded flex items-center justify-center text-xs font-bold">✕</div>
            <span>Unavailable (0 units)</span>
          </div>
        </div>

        {/* Selected Date Info */}
        {selectedDate && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h4>
            {(() => {
              const dayAvailability = getAvailabilityForDate(selectedDate);
              if (!dayAvailability) {
                return <p className="text-gray-600">No availability data for this date</p>;
              }

              const status = getAvailabilityStatus(dayAvailability.total_available, requestedQuantity);
              
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(status)}>
                      {dayAvailability.total_available} units available
                    </Badge>
                    {status === 'available' && (
                      <span className="text-green-600 text-sm">✅ Meets your request</span>
                    )}
                    {status === 'partial' && (
                      <span className="text-yellow-600 text-sm">⚠️ Partially available</span>
                    )}
                    {status === 'unavailable' && (
                      <span className="text-red-600 text-sm">❌ Not available</span>
                    )}
                  </div>
                  
                  <div className="text-sm">
                    <div>
                      <span className="text-gray-600">Tracked Units:</span>
                      <span className="ml-2 font-medium">{dayAvailability.tracked_available}</span>
                    </div>
                  </div>

                  {dayAvailability.conflicts && dayAvailability.conflicts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {dayAvailability.conflicts.length} active assignments:
                      </p>
                       <div className="max-h-32 overflow-y-auto space-y-1 bg-white p-2 rounded border">
                         {dayAvailability.conflicts.map((conflict, idx) => (
                           <div key={idx} className="text-xs text-gray-600 py-1 border-b border-gray-100 last:border-b-0 flex items-center justify-between">
                             <div>
                              <div className="font-medium">{conflict.job_number || 'Unknown Job'}</div>
                              <div className="text-gray-500">{conflict.customer_name || 'Unknown Customer'}</div>
                            </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};