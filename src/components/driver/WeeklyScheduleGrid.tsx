import React from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks } from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDateSafe } from '@/lib/dateUtils';

interface ScheduleDay {
  date: string;
  dayOfWeek: string;
  hasShift: boolean;
  hasJob: boolean;
  hasTimeOff: boolean;
  hasConflict: boolean;
  shiftTime?: string;
  jobTitle?: string;
  timeOffReason?: string;
}

interface WeeklyScheduleGridProps {
  scheduleDays: ScheduleDay[];
  startDate: Date;
  endDate: Date;
}

export const WeeklyScheduleGrid: React.FC<WeeklyScheduleGridProps> = ({
  scheduleDays,
  startDate,
  endDate
}) => {
  // Group days by weeks
  const groupByWeeks = () => {
    const weeks: { start: Date; end: Date; days: ScheduleDay[] }[] = [];
    let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 1 }); // Monday start
    
    while (currentWeekStart <= endDate) {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
      
      const weekScheduleDays = weekDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return scheduleDays.find(sd => sd.date === dateStr) || {
          date: dateStr,
          dayOfWeek: format(day, 'EEE'),
          hasShift: false,
          hasJob: false,
          hasTimeOff: false,
          hasConflict: false
        };
      });

      weeks.push({
        start: currentWeekStart,
        end: weekEnd,
        days: weekScheduleDays
      });

      currentWeekStart = addWeeks(currentWeekStart, 1);
    }
    
    return weeks;
  };

  const weeks = groupByWeeks();

  const getDayStatusColor = (day: ScheduleDay) => {
    if (day.hasConflict) return 'bg-destructive/20 border-destructive';
    if (day.hasTimeOff) return 'bg-muted border-muted-foreground';
    if (day.hasJob) return 'bg-primary/20 border-primary';
    if (day.hasShift) return 'bg-secondary border-secondary-foreground';
    return 'bg-background border-border';
  };

  const getDayStatusBadge = (day: ScheduleDay) => {
    if (day.hasConflict) return <Badge variant="destructive" className="text-xs">Conflict</Badge>;
    if (day.hasTimeOff) return <Badge variant="secondary" className="text-xs">Time Off</Badge>;
    if (day.hasJob) return <Badge variant="default" className="text-xs">Job</Badge>;
    if (day.hasShift) return <Badge variant="outline" className="text-xs">Shift</Badge>;
    return null;
  };

  return (
    <div className="w-full">
      <ScrollArea className="w-full">
        <ScrollBar orientation="horizontal" />
        <div className="flex space-x-4 pb-4 min-w-max">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="min-w-[280px] md:min-w-[320px]">
              {/* Week Header */}
              <div className="mb-3 text-center">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Week of {format(week.start, 'MMM d')}
                </h4>
              </div>
              
              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day Headers */}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-xs font-medium text-center p-1 text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {/* Day Cards */}
                {week.days.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`
                      min-h-[80px] p-2 rounded-lg border transition-all
                      ${getDayStatusColor(day)}
                      hover:scale-105 hover:shadow-sm
                    `}
                  >
                    <div className="text-xs font-medium mb-1">
                      {format(new Date(day.date), 'd')}
                    </div>
                    
                    <div className="space-y-1">
                      {getDayStatusBadge(day)}
                      
                      {day.shiftTime && (
                        <div className="text-xs text-muted-foreground">
                          {day.shiftTime}
                        </div>
                      )}
                      
                      {day.jobTitle && (
                        <div className="text-xs text-foreground truncate">
                          {day.jobTitle}
                        </div>
                      )}
                      
                      {day.timeOffReason && (
                        <div className="text-xs text-muted-foreground truncate">
                          {day.timeOffReason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};