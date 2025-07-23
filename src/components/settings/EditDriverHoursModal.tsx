
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Copy } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditDriverHoursModalProps {
  driverId: string;
  onClose: () => void;
}

interface DaySchedule {
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
}

const DAYS = [
  { key: 0, label: 'Sunday', short: 'Sun' },
  { key: 1, label: 'Monday', short: 'Mon' },
  { key: 2, label: 'Tuesday', short: 'Tue' },
  { key: 3, label: 'Wednesday', short: 'Wed' },
  { key: 4, label: 'Thursday', short: 'Thu' },
  { key: 5, label: 'Friday', short: 'Fri' },
  { key: 6, label: 'Saturday', short: 'Sat' },
];

const QUICK_TEMPLATES = [
  { name: 'Weekdays Only', pattern: [false, true, true, true, true, true, false] },
  { name: 'Weekends Only', pattern: [true, false, false, false, false, false, true] },
  { name: 'All Week', pattern: [true, true, true, true, true, true, true] },
  { name: 'Reset Default', pattern: [false, false, false, false, false, false, false] },
];

export function EditDriverHoursModal({ driverId, onClose }: EditDriverHoursModalProps) {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: driver, isLoading } = useQuery({
    queryKey: ['driver-details', driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          driver_working_hours(*)
        `)
        .eq('id', driverId)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Initialize schedule with existing data or defaults
      const existingHours = data.driver_working_hours || [];
      const initialSchedule = DAYS.map(day => {
        const existing = existingHours.find((h: any) => h.day_of_week === day.key);
        return existing || {
          day_of_week: day.key,
          is_working: false,
          start_time: '09:00',
          end_time: '17:00'
        };
      });
      setSchedule(initialSchedule);
    }
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (updatedSchedule: DaySchedule[]) => {
      // Delete existing hours for this driver
      await supabase
        .from('driver_working_hours')
        .delete()
        .eq('driver_id', driverId);
      
      // Insert new hours
      const { error } = await supabase
        .from('driver_working_hours')
        .insert(
          updatedSchedule.map(day => ({
            driver_id: driverId,
            ...day
          }))
        );
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Driver working hours updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['drivers-for-hours'] });
      queryClient.invalidateQueries({ queryKey: ['driver-details', driverId] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update working hours",
        variant: "destructive",
      });
    }
  });

  const handleDayToggle = (dayIndex: number, isWorking: boolean) => {
    setSchedule(prev => prev.map((day, index) => 
      index === dayIndex ? { ...day, is_working: isWorking } : day
    ));
  };

  const handleTimeChange = (dayIndex: number, field: 'start_time' | 'end_time', value: string) => {
    setSchedule(prev => prev.map((day, index) => 
      index === dayIndex ? { ...day, [field]: value } : day
    ));
  };

  const applyTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setSchedule(prev => prev.map((day, index) => ({
      ...day,
      is_working: template.pattern[index]
    })));
  };

  const copyTimeToAll = (sourceDay: DaySchedule) => {
    setSchedule(prev => prev.map(day => ({
      ...day,
      start_time: sourceDay.start_time,
      end_time: sourceDay.end_time
    })));
  };

  const handleSave = () => {
    updateScheduleMutation.mutate(schedule);
  };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Overview
            </Button>
          </div>
          <DialogTitle className="flex items-center space-x-3">
            <Clock className="w-6 h-6" />
            <span>Edit Working Hours - {driver?.first_name} {driver?.last_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Templates */}
          <div>
            <Label className="text-base font-medium mb-3 block">Quick Templates</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TEMPLATES.map((template) => (
                <Button
                  key={template.name}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template)}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Daily Schedule */}
          <div>
            <Label className="text-base font-medium mb-3 block">Weekly Schedule</Label>
            <div className="space-y-3">
              {DAYS.map((day, index) => {
                const daySchedule = schedule[index];
                if (!daySchedule) return null;

                return (
                  <div key={day.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-20">
                        <Badge variant={daySchedule.is_working ? "default" : "secondary"}>
                          {day.short}
                        </Badge>
                      </div>
                      <div className="w-24 text-sm font-medium">
                        {day.label}
                      </div>
                      <Switch
                        checked={daySchedule.is_working}
                        onCheckedChange={(checked) => handleDayToggle(index, checked)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {daySchedule.is_working ? 'Working' : 'Off'}
                      </span>
                    </div>

                    {daySchedule.is_working && (
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Label className="text-sm">Start:</Label>
                          <Input
                            type="time"
                            value={daySchedule.start_time}
                            onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                            className="w-24"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label className="text-sm">End:</Label>
                          <Input
                            type="time"
                            value={daySchedule.end_time}
                            onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                            className="w-24"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyTimeToAll(daySchedule)}
                          title="Copy times to all days"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateScheduleMutation.isPending}
            >
              {updateScheduleMutation.isPending ? 'Saving...' : 'Save Working Hours'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
