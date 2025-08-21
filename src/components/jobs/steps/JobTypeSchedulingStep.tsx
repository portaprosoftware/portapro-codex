import React, { useState } from 'react';
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
  const [trackHours, setTrackHours] = useState(false);

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
    if (field === 'days') {
      const days = Math.max(1, value);
      updateData({ rental_duration_days: days });
      // If setting days ≥ 1, turn off track hours toggle and clear hours
      if (days >= 1) {
        setTrackHours(false);
        updateData({ rental_duration_hours: 0 });
      }
    } else {
      const hours = Math.max(0, Math.min(23, value));
      updateData({ rental_duration_hours: hours });
      // If setting hours > 0, ensure days is 0 for hourly billing
      if (hours > 0) {
        updateData({ rental_duration_days: 0 });
      }
    }
  };

  // Calculate return date using "1 day = 24 hours from delivery time" model
  React.useEffect(() => {
    if (state.data.scheduled_date && state.data.job_type === 'delivery') {
      const days = state.data.rental_duration_days || 0;
      const hours = state.data.rental_duration_hours || 0;
      
      // Only calculate return date if we have valid duration
      if (days > 0 || hours > 0) {
        // Create start date/time in customer's timezone
        const scheduledDate = new Date(state.data.scheduled_date);
        const deliveryTime = state.data.scheduled_time || '08:00'; // Default to 8:00 AM
        const [timeHours, timeMinutes] = deliveryTime.split(':').map(Number);
        
        // Set the delivery time on the scheduled date
        const startDateTime = new Date(scheduledDate);
        startDateTime.setHours(timeHours, timeMinutes, 0, 0);
        
        // Calculate return date/time: 1 day = exactly 24 hours from delivery time
        let returnDateTime = new Date(startDateTime);
        if (days > 0) {
          // Daily billing: add exact 24-hour periods, ignore hours
          returnDateTime.setTime(startDateTime.getTime() + (days * 24 * 60 * 60 * 1000));
        } else if (hours > 0) {
          // Hourly billing: add exact hours
          returnDateTime.setTime(startDateTime.getTime() + (hours * 60 * 60 * 1000));
        }
        
        const returnDateString = formatDateForQuery(returnDateTime);
        updateData({ return_date: returnDateString });
      }
    }
  }, [state.data.scheduled_date, state.data.scheduled_time, state.data.rental_duration_days, state.data.rental_duration_hours, state.data.job_type, updateData]);

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
              <CardContent className="p-4">
                <CalendarComponent
                  mode="single"
                  selected={state.data.scheduled_date ? (() => {
                    // Create a Date object at noon local time to avoid timezone issues
                    const [year, month, day] = state.data.scheduled_date.split('-').map(Number);
                    return new Date(year, month - 1, day, 12, 0, 0);
                  })() : undefined}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-none border-0 mx-auto pointer-events-auto
                    [&_.rdp-months]:w-fit
                    [&_.rdp-month]:w-fit
                    [&_.rdp-table]:w-fit
                    [&_.rdp-caption]:text-xl [&_.rdp-caption]:font-bold [&_.rdp-caption]:py-4 [&_.rdp-caption]:px-6
                    [&_.rdp-nav]:gap-3 [&_.rdp-nav_button]:h-10 [&_.rdp-nav_button]:w-10 [&_.rdp-nav_button]:rounded-xl [&_.rdp-nav_button]:border [&_.rdp-nav_button]:bg-background [&_.rdp-nav_button]:hover:bg-accent
                    [&_.rdp-head_cell]:p-3 [&_.rdp-head_cell]:text-base [&_.rdp-head_cell]:font-semibold [&_.rdp-head_cell]:text-muted-foreground [&_.rdp-head_cell]:w-14
                    [&_.rdp-cell]:p-1
                    [&_.rdp-day]:h-14 [&_.rdp-day]:w-14 [&_.rdp-day]:text-base [&_.rdp-day]:font-medium [&_.rdp-day]:rounded-xl [&_.rdp-day]:transition-all [&_.rdp-day]:hover:bg-accent [&_.rdp-day]:hover:scale-105
                    [&_.rdp-day_selected]:bg-gradient-to-r [&_.rdp-day_selected]:from-primary [&_.rdp-day_selected]:to-primary-variant [&_.rdp-day_selected]:text-primary-foreground [&_.rdp-day_selected]:font-bold [&_.rdp-day_selected]:shadow-lg [&_.rdp-day_selected]:hover:shadow-xl [&_.rdp-day_selected]:scale-110
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
                  {/* Days - Always visible and primary */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Keep for (Days)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={state.data.rental_duration_days || 1}
                      onChange={(e) => handleRentalDurationChange('days', parseInt(e.target.value) || 1)}
                      className="text-center"
                    />
                    <p className="text-xs text-muted-foreground">
                      1 day = 24 hours from your delivery time
                    </p>
                  </div>

                  {/* Track hours toggle */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={trackHours}
                        onCheckedChange={(checked) => {
                          setTrackHours(checked);
                          if (checked) {
                            updateData({ rental_duration_days: 0, rental_duration_hours: 1 });
                          } else {
                            updateData({ rental_duration_hours: 0, rental_duration_days: 1 });
                          }
                        }}
                      />
                      <Label className="text-sm font-medium">Track hours (less than 24 hours)</Label>
                    </div>
                     <p className="text-xs text-muted-foreground">
                       Use hours for rentals under 24h. Days and hours cannot be combined. To see exact start and end times in the live preview, set a delivery time.
                     </p>

                    {/* Hours input - only shown when toggle is ON */}
                    {trackHours && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Hours (1-23)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="23"
                          value={state.data.rental_duration_hours || 1}
                          onChange={(e) => handleRentalDurationChange('hours', parseInt(e.target.value) || 1)}
                          className="text-center"
                        />
                      </div>
                    )}
                  </div>

                  {/* Live Preview */}
                  {state.data.scheduled_date && (state.data.rental_duration_days || (trackHours && state.data.rental_duration_hours)) && (
                    <div className="pt-3 border-t text-sm text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">Live Preview</p>
                      {(() => {
                        // Parse date string correctly to avoid timezone issues
                        const [year, month, day] = state.data.scheduled_date.split('-').map(Number);
                        const scheduledDate = new Date(year, month - 1, day);
                        const deliveryTime = state.data.scheduled_time || '08:00';
                        const [timeHours, timeMinutes] = deliveryTime.split(':').map(Number);
                        const startDateTime = new Date(scheduledDate);
                        startDateTime.setHours(timeHours, timeMinutes, 0, 0);
                        
                        const days = state.data.rental_duration_days || 0;
                        const hours = state.data.rental_duration_hours || 0;
                        
                        let returnDateTime = new Date(startDateTime);
                        let billingType = '';
                        
                        if (days > 0) {
                          returnDateTime.setTime(startDateTime.getTime() + (days * 24 * 60 * 60 * 1000));
                          billingType = 'Daily';
                        } else if (hours > 0) {
                          returnDateTime.setTime(startDateTime.getTime() + (hours * 60 * 60 * 1000));
                          billingType = 'Hourly';
                        }
                        
                         const formatDateOnly = (date: Date) => {
                           return date.toLocaleDateString('en-US', { 
                             weekday: 'short', 
                             month: 'short', 
                             day: 'numeric' 
                           });
                         };
                         
                         const formatDateTime = (date: Date) => {
                           return formatDateOnly(date) + ' @ ' + date.toLocaleTimeString('en-US', { 
                             hour: 'numeric', 
                             minute: '2-digit',
                             hour12: true 
                           });
                         };
                         
                         const hasTimeSelected = !!state.data.scheduled_time;
                         const formatStart = hasTimeSelected ? formatDateTime(startDateTime) : formatDateOnly(startDateTime);
                         const formatReturn = hasTimeSelected ? formatDateTime(returnDateTime) : formatDateOnly(returnDateTime);
                         
                         return (
                           <p>
                             <span className="font-medium">Start:</span> {formatStart} → <span className="font-medium">Return:</span> {formatReturn} ({billingType})
                           </p>
                         );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {errors.rental_duration && (
                <p className="text-sm text-destructive">{errors.rental_duration}</p>
              )}
            </div>
          )}

        {/* Add Pickup Job Section - Only for delivery jobs */}
        {state.data.job_type === 'delivery' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={state.data.create_pickup_job || false}
                  onCheckedChange={(checked) => updateData({ create_pickup_job: checked })}
                />
                <Label className="text-base font-medium">Add Pickup Job</Label>
              </div>
              <Label className="text-sm">Schedule return pickup</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Create a pickup job to schedule when equipment should be returned
            </p>

            {/* Pickup Job Details */}
            {state.data.create_pickup_job && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  {/* Pickup Date */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Pickup Date</Label>
                    <div className="flex justify-center">
                      <Card className="overflow-hidden w-fit">
                        <CardContent className="p-4">
                          <CalendarComponent
                            mode="single"
                            selected={state.data.pickup_date ? (() => {
                              const [year, month, day] = state.data.pickup_date.split('-').map(Number);
                              return new Date(year, month - 1, day, 12, 0, 0);
                            })() : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const formattedDate = formatDateForQuery(date);
                                updateData({ pickup_date: formattedDate });
                              }
                            }}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              // Disable dates before today and before delivery date
                              const deliveryDate = state.data.scheduled_date ? new Date(state.data.scheduled_date) : today;
                              return date < today || date < deliveryDate;
                            }}
                            className="rounded-none border-0 mx-auto pointer-events-auto
                              [&_.rdp-months]:w-fit
                              [&_.rdp-month]:w-fit
                              [&_.rdp-table]:w-fit
                              [&_.rdp-caption]:text-lg [&_.rdp-caption]:font-bold [&_.rdp-caption]:py-3 [&_.rdp-caption]:px-4
                              [&_.rdp-nav]:gap-2 [&_.rdp-nav_button]:h-8 [&_.rdp-nav_button]:w-8 [&_.rdp-nav_button]:rounded-lg [&_.rdp-nav_button]:border [&_.rdp-nav_button]:bg-background [&_.rdp-nav_button]:hover:bg-accent
                              [&_.rdp-head_cell]:p-2 [&_.rdp-head_cell]:text-sm [&_.rdp-head_cell]:font-semibold [&_.rdp-head_cell]:text-muted-foreground [&_.rdp-head_cell]:w-10
                              [&_.rdp-cell]:p-0.5
                              [&_.rdp-day]:h-10 [&_.rdp-day]:w-10 [&_.rdp-day]:text-sm [&_.rdp-day]:font-medium [&_.rdp-day]:rounded-lg [&_.rdp-day]:transition-all [&_.rdp-day]:hover:bg-accent [&_.rdp-day]:hover:scale-105
                              [&_.rdp-day_selected]:bg-gradient-to-r [&_.rdp-day_selected]:from-amber-500 [&_.rdp-day_selected]:to-amber-600 [&_.rdp-day_selected]:text-white [&_.rdp-day_selected]:font-bold [&_.rdp-day_selected]:shadow-lg [&_.rdp-day_selected]:hover:shadow-xl
                              [&_.rdp-day_today]:bg-accent [&_.rdp-day_today]:text-accent-foreground [&_.rdp-day_today]:font-semibold
                              [&_.rdp-day_outside]:text-muted-foreground/40 [&_.rdp-day_outside]:hover:bg-muted/20
                              [&_.rdp-day_disabled]:text-muted-foreground/20 [&_.rdp-day_disabled]:cursor-not-allowed [&_.rdp-day_disabled]:hover:bg-transparent [&_.rdp-day_disabled]:hover:scale-100"
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Pickup Time */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={!!state.data.pickup_time}
                          onCheckedChange={(enabled) => {
                            updateData({ 
                              pickup_time: enabled ? (state.data.pickup_time || '09:00') : null
                            });
                          }}
                        />
                        <Label className="text-base font-medium">Specific Pickup Time</Label>
                      </div>
                      <Label className="text-sm">Set pickup time</Label>
                    </div>

                    {state.data.pickup_time !== null && (
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <TimePresetButtons 
                            onTimeSelect={(time) => updateData({ pickup_time: time })}
                            selectedTime={state.data.pickup_time}
                          />
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <TimePicker
                              value={state.data.pickup_time}
                              onChange={(time) => updateData({ pickup_time: time })}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Pickup Priority */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={state.data.pickup_is_priority || false}
                          onCheckedChange={(checked) => updateData({ pickup_is_priority: checked })}
                        />
                        <Label className="text-base font-medium">Pickup Priority</Label>
                      </div>
                      <Label className="text-sm flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Priority Pickup
                      </Label>
                    </div>
                    {state.data.pickup_is_priority && (
                      <p className="text-sm text-muted-foreground">
                        This pickup job will be highlighted for drivers.
                      </p>
                    )}
                  </div>

                  {/* Pickup Notes */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Pickup Notes</Label>
                    <Textarea
                      placeholder="Special instructions for pickup (e.g., access requirements, contact information, etc.)"
                      value={state.data.pickup_notes || ''}
                      onChange={(e) => updateData({ pickup_notes: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Notes Section */}
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