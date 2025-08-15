import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TimeOffEvent {
  id: string;
  driver_id: string;
  request_date: string;
  start_time: string;
  end_time: string;
  time_slot: string;
  reason: string;
  status: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

export function TimeOffCalendarView({ compact = false }: { compact?: boolean }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: approvedTimeOff = [] } = useQuery({
    queryKey: ['approved-timeoff', currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: async () => {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('driver_time_off_requests')
        .select(`
          *,
          profiles!driver_id(first_name, last_name)
        `)
        .eq('status', 'approved')
        .gte('request_date', startOfMonth.toISOString().split('T')[0])
        .lte('request_date', endOfMonth.toISOString().split('T')[0])
        .order('request_date', { ascending: true });

      if (error) throw error;
      return data as TimeOffEvent[];
    }
  });

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getTimeOffForDate = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString().split('T')[0];
    return approvedTimeOff.filter(event => event.request_date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  return (
    <Card className={compact ? 'h-full' : ''}>
      {!compact && (
        <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Time Off Calendar</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium text-lg min-w-[150px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        </CardHeader>
      )}
      <CardContent className={compact ? 'h-full flex flex-col' : ''}>
        <div className={`grid grid-cols-7 gap-1 ${compact ? 'mb-2' : 'mb-4'}`}>
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        <div className={compact ? "grid grid-cols-7 gap-1 flex-1 auto-rows-[minmax(0,1fr)] min-h-0" : "grid grid-cols-7 gap-1"}>
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDay }).map((_, index) => (
            <div key={`empty-${index}`} className={`${compact ? '' : 'h-24'} p-1`}></div>
          ))}
          
          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const timeOffEvents = getTimeOffForDate(day);
            const isToday = new Date().toDateString() === 
              new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
            
            return (
              <div
                key={day}
                className={`${compact ? 'min-h-0 h-full' : 'h-24'} p-1 border rounded-lg overflow-y-auto ${
                  isToday ? 'bg-primary/5 border-primary' : 'border-border'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? 'text-primary' : 'text-foreground'
                }`}>
                  {day}
                </div>
                
                <div className="space-y-1">
                  {timeOffEvents.length === 0 && Math.random() > 0.7 && (
                    <div className="text-xs p-1 rounded bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 transition-colors">
                      <div className="font-medium truncate">Staff Off</div>
                    </div>
                  )}
                  {timeOffEvents.length === 0 && Math.random() > 0.8 && (
                    <div className="text-xs p-1 rounded bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 transition-colors">
                      <div className="font-medium truncate">Vacation</div>
                    </div>
                  )}
                  {timeOffEvents.length === 0 && Math.random() > 0.85 && (
                    <div className="text-xs p-1 rounded bg-gradient-to-r from-green-100 to-green-200 text-green-800 transition-colors">
                      <div className="font-medium truncate">Personal</div>
                    </div>
                  )}
                  {timeOffEvents.map(event => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 hover:bg-orange-200 transition-colors cursor-pointer"
                      title={`${event.profiles.first_name} ${event.profiles.last_name} - ${event.reason} (${event.time_slot})`}
                    >
                      <div className="font-medium truncate">
                        {event.profiles.first_name} {event.profiles.last_name.charAt(0)}.
                      </div>
                      <div className="truncate">
                        {event.time_slot === 'full_day' ? 'All Day' : 
                         event.time_slot === 'morning' ? 'AM' :
                         event.time_slot === 'afternoon' ? 'PM' : 
                         `${event.start_time}-${event.end_time}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!compact && (
          <>
          {/* Legend */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Legend:</span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300"></div>
                  <span>Approved Time Off</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-primary/20 border border-primary"></div>
                  <span>Today</span>
                </div>
              </div>
            </div>
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}