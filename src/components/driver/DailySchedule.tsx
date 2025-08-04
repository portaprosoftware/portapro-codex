import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { Calendar as CalendarIcon, Clock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isSameDay, parseISO } from 'date-fns';
import { formatDateForQuery } from '@/lib/dateUtils';

interface Job {
  id: string;
  job_number: string;
  job_type: string;
  status: string;
  scheduled_date: string;
  scheduled_time?: string;
  customers: {
    name?: string;
  } | null;
}

const TIME_SLOTS = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM'
];

export const DailySchedule: React.FC = () => {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Fetch jobs for the selected date
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['driver-daily-jobs', user?.id, selectedDate],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const dateStr = formatDateForQuery(selectedDate);
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers (
            name
          )
        `)
        .eq('driver_id', user.id)
        .eq('scheduled_date', dateStr)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      return data as Job[];
    },
    enabled: !!user?.id
  });

  // Fetch jobs for calendar dots (current month)
  const { data: monthJobs } = useQuery({
    queryKey: ['driver-month-jobs', user?.id, selectedDate.getMonth(), selectedDate.getFullYear()],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('jobs')
        .select('scheduled_date')
        .eq('driver_id', user.id)
        .gte('scheduled_date', formatDateForQuery(startOfMonth))
        .lte('scheduled_date', formatDateForQuery(endOfMonth));

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const getJobTypeColor = (jobType: string) => {
    const colors: Record<string, string> = {
      'delivery': 'bg-blue-500 text-white',
      'pickup': 'bg-green-500 text-white', 
      'service': 'bg-orange-500 text-white',
      'on-site-survey': 'bg-red-800 text-white',
      'estimate': 'bg-purple-500 text-white'
    };
    return colors[jobType] || 'bg-gray-500 text-white';
  };

  const getJobsForTimeSlot = (timeSlot: string) => {
    if (!jobs) return [];
    
    // Convert time slot to 24-hour format for comparison
    const slotHour = parseInt(timeSlot.split(':')[0]);
    const isPM = timeSlot.includes('PM');
    const hour24 = isPM && slotHour !== 12 ? slotHour + 12 : (!isPM && slotHour === 12 ? 0 : slotHour);
    
    return jobs.filter(job => {
      if (!job.scheduled_time) return false;
      
      const jobTime = job.scheduled_time.split(':');
      const jobHour = parseInt(jobTime[0]);
      
      return jobHour === hour24;
    });
  };

  const hasJobsOnDate = (date: Date) => {
    if (!monthJobs) return false;
    const dateStr = formatDateForQuery(date);
    return monthJobs.some(job => job.scheduled_date === dateStr);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Date Header with Calendar Dropdown */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="text-center w-full">
                <div className="text-sm font-medium text-gray-500 uppercase">
                  {format(selectedDate, 'EEEE')}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl font-semibold text-gray-900">
                    {format(selectedDate, 'MMMM d, yyyy')}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
                {isToday && (
                  <div className="text-xs text-blue-600 font-medium">Today</div>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              className="p-3 pointer-events-auto"
              modifiers={{
                hasJobs: (date) => hasJobsOnDate(date)
              }}
              modifiersStyles={{
                hasJobs: {
                  position: 'relative'
                }
              }}
              components={{
                Day: ({ date, ...props }) => {
                  const hasJobs = hasJobsOnDate(date);
                  return (
                    <div className="relative" {...props}>
                      <div>{date.getDate()}</div>
                      {hasJobs && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  );
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Daily Schedule Content */}
      <div className="flex-1 overflow-y-auto">
        {jobs && jobs.length > 0 ? (
          <div className="p-4 space-y-4">
            {TIME_SLOTS.map((timeSlot) => {
              const slotJobs = getJobsForTimeSlot(timeSlot);
              
              return (
                <div key={timeSlot} className="flex">
                  {/* Time Label */}
                  <div className="w-20 flex-shrink-0 pt-2">
                    <span className="text-sm font-medium text-gray-500">{timeSlot}</span>
                  </div>
                  
                  {/* Jobs for this time slot */}
                  <div className="flex-1 space-y-2">
                    {slotJobs.length > 0 ? (
                      slotJobs.map(job => (
                        <Card key={job.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className={`${getJobTypeColor(job.job_type)} text-xs px-2 py-1 rounded-full`}>
                                {job.job_type}
                              </Badge>
                              <span className="text-xs text-gray-400">{job.job_number}</span>
                            </div>
                            
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {job.customers?.name || 'Unknown Customer'}
                            </div>
                            
                            {job.scheduled_time && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                {job.scheduled_time}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="h-8"></div> // Placeholder for empty time slots
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <CalendarIcon className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">Nothing planned</h3>
            <p className="text-sm text-center">You have no jobs scheduled for this day.</p>
          </div>
        )}
      </div>
    </div>
  );
};