import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { X, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { formatDateForQuery, formatDateSafe } from '@/lib/dateUtils';
import { useDriverWorkingHours } from '@/hooks/useDriverWorkingHours';
import { FileUploadButton } from './FileUploadButton';
import { WeeklyScheduleGrid } from './WeeklyScheduleGrid';

interface MobileTimeOffRequestSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export const MobileTimeOffRequestSlider: React.FC<MobileTimeOffRequestSliderProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);

  // Fetch driver's working hours
  const { data: workingHours } = useDriverWorkingHours(user?.id);

  // Fetch existing time-off requests for conflict detection
  const { data: existingTimeOff } = useQuery({
    queryKey: ['driver-time-off-range', user?.id, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      if (!user?.id || !dateRange?.from || !dateRange?.to) return [];

      const { data, error } = await supabase
        .from('driver_time_off_requests')
        .select('*')
        .eq('driver_id', user.id)
        .gte('start_time', formatDateForQuery(dateRange.from))
        .lte('end_time', formatDateForQuery(dateRange.to))
        .eq('status', 'approved');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!dateRange?.from && !!dateRange?.to
  });

  // Fetch scheduled jobs for the date range
  const { data: scheduledJobs } = useQuery({
    queryKey: ['driver-jobs-range', user?.id, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      if (!user?.id || !dateRange?.from || !dateRange?.to) return [];

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('driver_id', user.id)
        .gte('scheduled_date', formatDateForQuery(dateRange.from))
        .lte('scheduled_date', formatDateForQuery(dateRange.to));

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!dateRange?.from && !!dateRange?.to
  });

  const createTimeOffMutation = useMutation({
    mutationFn: async (newRequest: { start_time: string; end_time: string; reason: string; attachment_url?: string | null }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('driver_time_off_requests')
        .insert({
          driver_id: user.id,
          request_date: new Date().toISOString().split('T')[0],
          start_time: newRequest.start_time,
          end_time: newRequest.end_time,
          reason: newRequest.reason,
          status: 'pending',
          time_slot: 'full_day',
          attachment_url: newRequest.attachment_url
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['driver-time-off'] });
      const startDate = format(new Date(data.start_time), 'MMM d');
      const endDate = format(new Date(data.end_time), 'MMM d');
      toast.success(`Your time-off request for ${startDate}–${endDate} has been submitted for approval`);
      onClose();
      setDateRange(undefined);
      setReason('');
      setAttachmentUrl(null);
    },
    onError: (error) => {
      console.error('Error creating time off request:', error);
      toast.error('Failed to submit time off request');
    }
  });

  const generateSchedulePreview = (): ScheduleDay[] => {
    if (!dateRange?.from || !dateRange?.to) return [];

    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    return days.map(date => {
      const dayOfWeek = date.getDay();
      const hasShift = workingHours?.some(wh => 
        wh.day_of_week === dayOfWeek && wh.is_active
      ) || false;
      
      const hasJob = scheduledJobs?.some(job => 
        isSameDay(parseISO(job.scheduled_date), date)
      ) || false;
      
      const hasTimeOff = existingTimeOff?.some(timeOff => {
        const start = parseISO(timeOff.start_time);
        const end = parseISO(timeOff.end_time);
        return date >= start && date <= end;
      }) || false;
      
      const hasConflict = hasJob || hasTimeOff;

      // Get additional details
      const job = scheduledJobs?.find(job => isSameDay(parseISO(job.scheduled_date), date));
      const timeOff = existingTimeOff?.find(timeOff => {
        const start = parseISO(timeOff.start_time);
        const end = parseISO(timeOff.end_time);
        return date >= start && date <= end;
      });

      return { 
        date: formatDateForQuery(date),
        dayOfWeek: format(date, 'EEE'),
        hasShift, 
        hasJob, 
        hasTimeOff, 
        hasConflict,
        shiftTime: hasShift ? '8:00 AM - 5:00 PM' : undefined,
        jobTitle: job ? `${job.job_type} Job` : undefined,
        timeOffReason: timeOff ? timeOff.reason : undefined
      };
    });
  };

  const schedulePreview = generateSchedulePreview();
  const hasConflicts = schedulePreview.some(day => day.hasConflict);
  const canSubmit = dateRange?.from && dateRange?.to && reason.trim().length > 0;

  const handleSubmit = () => {
    if (!dateRange?.from || !dateRange?.to || !reason.trim()) return;

    createTimeOffMutation.mutate({
      start_time: formatDateForQuery(dateRange.from),
      end_time: formatDateForQuery(dateRange.to),
      reason: reason.trim(),
      attachment_url: attachmentUrl
    });
  };


  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[480px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Request Time Off</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Date Range Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Date Range</Label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
                placeholder="Pick your time off dates"
                className="w-full"
              />
            </div>

            {/* Enhanced Schedule Preview with Horizontal Scrolling */}
            {schedulePreview.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Your Upcoming Schedule</Label>
                
                <WeeklyScheduleGrid
                  scheduleDays={schedulePreview}
                  startDate={dateRange!.from!}
                  endDate={dateRange!.to!}
                />
                
                {/* Conflict Warning */}
                {hasConflicts && (
                  <div className="flex items-start space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-destructive">Schedule Conflicts Detected</p>
                      <p className="text-destructive/80 mt-1">
                        You have scheduled jobs or approved time off during this period. You can still submit this request, but conflicts will need to be resolved.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Briefly describe why you're requesting time off..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Document Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Supporting Document (Optional)</Label>
              <FileUploadButton
                onFileUploaded={setAttachmentUrl}
                uploadedFile={attachmentUrl}
                onFileRemoved={() => setAttachmentUrl(null)}
                disabled={createTimeOffMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Upload medical notes, travel documents, etc. (PDF, images, or documents up to 10MB)
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-background p-6">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || createTimeOffMutation.isPending}
              className="flex-1 bg-gradient-primary text-white"
            >
              {createTimeOffMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};