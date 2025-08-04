import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from 'date-fns';

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

interface ShiftBlock {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
}

// Mock shift data - this would come from the database
const SHIFTS: ShiftBlock[] = [
  { id: '1', name: 'Morning', startTime: '07:00', endTime: '15:00', color: 'bg-gradient-blue' },
  { id: '2', name: 'Afternoon', startTime: '15:00', endTime: '23:00', color: 'bg-gradient-orange' },
  { id: '3', name: 'Evening', startTime: '23:00', endTime: '07:00', color: 'bg-gradient-purple' },
];

export const WeeklySchedule: React.FC = () => {
  const { user } = useUser();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['driver-weekly-jobs', user?.id, currentWeek],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const weekStart = format(currentWeek, 'yyyy-MM-dd');
      const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers (
            name
          )
        `)
        .eq('driver_id', user.id)
        .gte('scheduled_date', weekStart)
        .lte('scheduled_date', weekEnd)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      return data as Job[];
    },
    enabled: !!user?.id
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const getJobsForDay = (date: Date) => {
    return jobs?.filter(job => 
      isSameDay(new Date(job.scheduled_date), date)
    ) || [];
  };

  const getJobTypeColor = (jobType: string) => {
    const colors: Record<string, string> = {
      'delivery': 'bg-gradient-blue',
      'pickup': 'bg-gradient-green', 
      'service': 'bg-gradient-orange',
      'on-site-survey': 'bg-red-800',
      'estimate': 'bg-gradient-purple'
    };
    return colors[jobType] || 'bg-gradient-gray';
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Week Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <h2 className="text-lg font-semibold text-gray-900">
            {format(currentWeek, 'MMM d')} - {format(addDays(currentWeek, 6), 'MMM d, yyyy')}
          </h2>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigateWeek('next')}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex min-w-full">
          {weekDays.map((day, index) => {
            const dayJobs = getJobsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div key={index} className="flex-1 min-w-0 border-r border-gray-200 last:border-r-0">
                {/* Day Header */}
                <div className={`p-3 text-center border-b border-gray-200 ${
                  isToday ? 'bg-blue-50' : 'bg-white'
                }`}>
                  <div className="text-xs font-medium text-gray-500 uppercase">
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-lg font-semibold ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>

                {/* Day Content */}
                <div className="p-2 space-y-2 min-h-[400px]">
                  {/* Shift Blocks */}
                  <div className="space-y-1">
                    {SHIFTS.map(shift => (
                      <div 
                        key={shift.id}
                        className={`${shift.color} text-white text-xs px-2 py-1 rounded text-center`}
                      >
                        {shift.name}
                      </div>
                    ))}
                  </div>

                  {/* Job Blocks */}
                  <div className="space-y-1">
                    {dayJobs.map(job => (
                      <Card key={job.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-2">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={`${getJobTypeColor(job.job_type)} text-white text-xs px-2 py-0.5 rounded-full`}>
                              {job.job_type}
                            </Badge>
                          </div>
                          
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {job.customers?.name || 'Unknown Customer'}
                          </div>
                          
                          {job.scheduled_time && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {job.scheduled_time}
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-400 mt-1">
                            {job.job_number}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Empty State */}
                  {dayJobs.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                      <Calendar className="w-6 h-6 mb-2" />
                      <span className="text-xs">No jobs</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};