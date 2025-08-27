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

  const { data: availability, isLoading } = useAvailabilityEngine(
    productId,
    format(monthStart, 'yyyy-MM-dd'),
    format(monthEnd, 'yyyy-MM-dd')
  );

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const getAvailabilityForDate = (date: Date) => {
    if (!availability?.daily_breakdown) return null;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return availability.daily_breakdown.find(day => day.date === dateStr);
  };

  const getAvailabilityStatus = (available: number, requested: number) => {
    if (available >= requested) return 'available';
    if (available > 0) return 'partial';
    return 'unavailable';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'partial':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600';
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
                    "relative h-12 p-1 flex flex-col items-center justify-center border-2 border-transparent",
                    getStatusColor(status),
                    isSelected && "ring-2 ring-blue-500",
                    isCurrentDay && "font-bold",
                    "hover:opacity-80"
                  )}
                >
                  <span className="text-sm">{format(date, 'd')}</span>
                  {dayAvailability && (
                    <span className="text-xs">{available}</span>
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
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
            <span>Available ({requestedQuantity}+ units)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded" />
            <span>Partial (1-{requestedQuantity - 1} units)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded" />
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
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Bulk Pool:</span>
                      <span className="ml-2 font-medium">{dayAvailability.bulk_available}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tracked Units:</span>
                      <span className="ml-2 font-medium">{dayAvailability.tracked_available}</span>
                    </div>
                  </div>

                  {dayAvailability.conflicts && dayAvailability.conflicts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {dayAvailability.conflicts.length} active assignments:
                      </p>
                      <div className="space-y-1">
                        {dayAvailability.conflicts.slice(0, 3).map((conflict, idx) => (
                          <div key={idx} className="text-xs text-gray-600">
                            • {conflict.job_number || 'Unknown Job'} - {conflict.customer_name || 'Unknown Customer'}
                          </div>
                        ))}
                        {dayAvailability.conflicts.length > 3 && (
                          <div className="text-xs text-gray-500">
                            ... and {dayAvailability.conflicts.length - 3} more
                          </div>
                        )}
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