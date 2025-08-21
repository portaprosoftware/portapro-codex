import React from 'react';
import { Calendar, Clock, Package, Truck, ClipboardCheck, Crosshair, Star, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { TimePresetButtons } from '@/components/ui/time-preset-buttons';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { formatDateForQuery, formatDateSafe } from '@/lib/dateUtils';

const jobTypes = [
  {
    value: 'delivery',
    label: 'Delivery',
    description: 'Deliver equipment to customer location',
    icon: Truck,
    color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
  },
  {
    value: 'pickup',
    label: 'Pickup',
    description: 'Pick up equipment from customer location',
    icon: Package,
    color: 'bg-gradient-to-r from-amber-600 to-amber-700 text-white',
  },
  {
    value: 'service',
    label: 'Service',
    description: 'Perform maintenance or cleaning service',
    icon: ClipboardCheck,
    color: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
  },
  {
    value: 'on-site-survey',
    label: 'Survey/Estimate',
    description: 'Survey location for future service',
    icon: Crosshair,
    color: 'bg-gradient-to-r from-red-800 to-red-900 text-white',
  },
] as const;

export function JobTypeSchedulingStep() {
  const { state, updateData } = useJobWizard();
  const { errors } = state;

  const handleJobTypeSelect = (jobType: string) => {
    updateData({ job_type: jobType as any });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = formatDateForQuery(date);
      console.log('Date selected:', date, 'Formatted:', formattedDate);
      updateData({ scheduled_date: formattedDate });
    }
  };

  const handleTimeChange = (time: string) => {
    updateData({ scheduled_time: time });
  };

  const handleTimeToggle = (enabled: boolean) => {
    updateData({ 
      scheduled_time: enabled ? (state.data.scheduled_time || '09:00') : null
    });
  };

  const handleNotesChange = (notes: string) => {
    updateData({ notes });
  };

  const handleTogglePriority = () => {
    updateData({ is_priority: !state.data.is_priority });
  };

  const handleRentalDurationChange = (field: 'days' | 'hours', value: number) => {
    const updates: any = {
      [`rental_duration_${field}`]: Math.max(0, value)
    };
    
    // Auto-set hours to 8 when days is set to 0 and hours is currently 0
    if (field === 'days' && value === 0 && (state.data.rental_duration_hours || 0) === 0) {
      updates.rental_duration_hours = 8;
    }
    
    updateData(updates);
  };

  // Calculate return date when scheduled date changes
  React.useEffect(() => {
    if (state.data.scheduled_date && state.data.job_type === 'delivery') {
      const days = state.data.rental_duration_days || 0;
      const hours = state.data.rental_duration_hours || 0;
      
      if (days > 0 || hours > 0) {
        const scheduledDate = new Date(state.data.scheduled_date);
        let returnDate = addDays(scheduledDate, days);
        
        // Add hours to the return date
        if (hours > 0) {
          returnDate = new Date(returnDate.getTime() + (hours * 60 * 60 * 1000));
        }
        
        updateData({ return_date: formatDateForQuery(returnDate) });
      }
    }
  }, [state.data.scheduled_date, state.data.rental_duration_days, state.data.rental_duration_hours, state.data.job_type, updateData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Job Type & Scheduling</h2>
        <p className="text-muted-foreground">
          Select the type of job and schedule when it should be performed.
        </p>
      </div>

      {/* Job Type Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Job Type</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {jobTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.value}
                className={cn(
                  "p-1 rounded-xl transition-all",
                  state.data.job_type === type.value && "ring-4 ring-offset-2",
                  type.value === 'delivery' && state.data.job_type === type.value && "ring-blue-500",
                  type.value === 'pickup' && state.data.job_type === type.value && "ring-amber-600",
                  type.value === 'service' && state.data.job_type === type.value && "ring-purple-500",
                  type.value === 'on-site-survey' && state.data.job_type === type.value && "ring-red-700"
                )}
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
                    type.color
                  )}
                  onClick={() => handleJobTypeSelect(type.value)}
                >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1 text-white">{type.label}</h3>
                      <p className="text-sm text-white/80">{type.description}</p>
                    </div>
                  </div>
                </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
        {errors.job_type && (
          <p className="text-sm text-destructive">{errors.job_type}</p>
        )}
      </div>

      {/* Date Selection and Right Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Date Selection - Left side */}
        <div className="lg:col-span-2 space-y-4">
          <Label className="text-base font-medium">Scheduled Date</Label>
          <div className="flex justify-center">
            <Card className="overflow-hidden w-fit">
              <CardContent className="p-3">
                <CalendarComponent
                  mode="single"
                  selected={state.data.scheduled_date ? (() => {
                    const [year, month, day] = state.data.scheduled_date.split('-').map(Number);
                    return new Date(year, month - 1, day);
                  })() : undefined}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-none border-0 mx-auto
                    [&_.rdp-months]:w-fit
                    [&_.rdp-month]:w-fit
                    [&_.rdp-table]:w-fit
                    [&_.rdp-caption]:text-lg [&_.rdp-caption]:font-bold [&_.rdp-caption]:py-3 [&_.rdp-caption]:px-4
                    [&_.rdp-nav]:gap-2 [&_.rdp-nav_button]:h-8 [&_.rdp-nav_button]:w-8 [&_.rdp-nav_button]:rounded-lg [&_.rdp-nav_button]:border [&_.rdp-nav_button]:bg-background [&_.rdp-nav_button]:hover:bg-accent
                    [&_.rdp-head_cell]:p-2 [&_.rdp-head_cell]:text-sm [&_.rdp-head_cell]:font-semibold [&_.rdp-head_cell]:text-muted-foreground [&_.rdp-head_cell]:w-10
                    [&_.rdp-cell]:p-0.5
                    [&_.rdp-day]:h-10 [&_.rdp-day]:w-10 [&_.rdp-day]:text-sm [&_.rdp-day]:font-medium [&_.rdp-day]:rounded-lg [&_.rdp-day]:transition-all [&_.rdp-day]:hover:bg-accent [&_.rdp-day]:hover:scale-105
                    [&_.rdp-day_selected]:bg-gradient-to-r [&_.rdp-day_selected]:from-primary [&_.rdp-day_selected]:to-primary-variant [&_.rdp-day_selected]:text-primary-foreground [&_.rdp-day_selected]:font-bold [&_.rdp-day_selected]:shadow-lg [&_.rdp-day_selected]:hover:shadow-xl
                    [&_.rdp-day_today]:bg-accent [&_.rdp-day_today]:text-accent-foreground [&_.rdp-day_today]:font-semibold
                    [&_.rdp-day_outside]:text-muted-foreground/40 [&_.rdp-day_outside]:hover:bg-muted/20
                    [&_.rdp-day_disabled]:text-muted-foreground/20 [&_.rdp-day_disabled]:cursor-not-allowed [&_.rdp-day_disabled]:hover:bg-transparent [&_.rdp-day_disabled]:hover:scale-100"
                />
              </CardContent>
            </Card>
          </div>
          {errors.scheduled_date && (
            <p className="text-sm text-destructive">{errors.scheduled_date}</p>
          )}
        </div>

        {/* Right Panel - Time Toggle, Priority, and Notes */}
        <div className="lg:col-span-3 space-y-6">
          {/* Time Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={!!state.data.scheduled_time}
                  onCheckedChange={handleTimeToggle}
                />
                <Label className="text-base font-medium">Specific Time</Label>
              </div>
              <Label className="text-sm">Set time</Label>
            </div>

            {state.data.scheduled_time !== null && (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <TimePresetButtons 
                    onTimeSelect={handleTimeChange}
                    selectedTime={state.data.scheduled_time}
                  />
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <TimePicker
                      value={state.data.scheduled_time}
                      onChange={handleTimeChange}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {errors.scheduled_time && (
              <p className="text-sm text-destructive">{errors.scheduled_time}</p>
            )}
          </div>

          {/* Priority Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={state.data.is_priority || false}
                  onCheckedChange={handleTogglePriority}
                />
                <Label className="text-base font-medium">Priority</Label>
              </div>
              <Label className="text-sm flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                Priority
              </Label>
            </div>
            {state.data.is_priority && (
              <p className="text-sm text-muted-foreground">
                This job will be highlighted for drivers.
              </p>
            )}
          </div>

          {/* Rental Duration - Only for delivery jobs */}
          {state.data.job_type === 'delivery' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <Label className="text-base font-medium">Rental Duration</Label>
              </div>
              
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Days</Label>
                      <Input
                        type="number"
                        min="0"
                        value={state.data.rental_duration_days || 0}
                        onChange={(e) => handleRentalDurationChange('days', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Hours</Label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={state.data.rental_duration_hours || 0}
                        onChange={(e) => handleRentalDurationChange('hours', parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                  </div>
                  
                  {state.data.return_date && (
                    <div className="pt-2 border-t text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium">Duration:</span>{' '}
                        {(() => {
                          const days = state.data.rental_duration_days || 0;
                          const hours = state.data.rental_duration_hours || 0;
                          
                          if (days === 0 && hours > 0) {
                            return `${hours} hour${hours !== 1 ? 's' : ''}`;
                          } else if (days > 0 && hours === 0) {
                            return `${days} day${days !== 1 ? 's' : ''}`;
                          } else if (days > 0 && hours > 0) {
                            return `${days} day${days !== 1 ? 's' : ''} and ${hours} hour${hours !== 1 ? 's' : ''}`;
                          }
                          return '';
                        })()}
                      </p>
                      <p>
                        <span className="font-medium">Return Date:</span>{' '}
                        {formatDateSafe(state.data.return_date, 'long')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {errors.rental_duration && (
                <p className="text-sm text-destructive">{errors.rental_duration}</p>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Job Notes (Optional)</Label>
            <Textarea
              placeholder="Add special instructions..."
              value={state.data.notes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      {state.data.job_type && state.data.scheduled_date && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Job Summary</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Type:</span>{' '}
                {jobTypes.find(t => t.value === state.data.job_type)?.label}
              </p>
              <p>
                <span className="font-medium">Date:</span>{' '}
                {formatDateSafe(state.data.scheduled_date, 'long')}
              </p>
               {state.data.scheduled_time && (
                 <p>
                   <span className="font-medium">Time:</span>{' '}
                   {(() => {
                     const [hours, minutes] = state.data.scheduled_time.split(':').map(Number);
                     const period = hours >= 12 ? 'PM' : 'AM';
                     const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                     return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
                   })()}
                 </p>
               )}
               {state.data.job_type === 'delivery' && (state.data.rental_duration_days || state.data.rental_duration_hours) && (
                  <p>
                    <span className="font-medium">Rental Duration:</span>{' '}
                    {(() => {
                      const days = state.data.rental_duration_days || 0;
                      const hours = state.data.rental_duration_hours || 0;
                      
                      if (days === 0 && hours > 0) {
                        return `${hours} hour${hours !== 1 ? 's' : ''}`;
                      } else if (days > 0 && hours === 0) {
                        return `${days} day${days !== 1 ? 's' : ''}`;
                      } else if (days > 0 && hours > 0) {
                        return `${days} day${days !== 1 ? 's' : ''} and ${hours} hour${hours !== 1 ? 's' : ''}`;
                      }
                      return '';
                    })()}
                  </p>
                )}
                {state.data.return_date && state.data.job_type === 'delivery' && (
                  <p>
                    <span className="font-medium">Return Date:</span>{' '}
                    {formatDateSafe(state.data.return_date, 'long')}
                  </p>
                )}
                {state.data.is_priority && (
                  <p>
                    <span className="font-medium">Priority:</span>{' '}
                    <span className="inline-flex items-center gap-1 text-yellow-600">
                      <Star className="w-3 h-3" />
                      High Priority
                    </span>
                  </p>
                )}
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}