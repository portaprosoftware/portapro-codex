import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Mail } from 'lucide-react';
import { FilterData, FilterPreset } from '@/hooks/useFilterPresets';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';

interface ScheduleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset?: FilterPreset;
  filterData: FilterData;
}

export const ScheduleReportModal: React.FC<ScheduleReportModalProps> = ({
  isOpen,
  onClose,
  preset,
  filterData
}) => {
  const [formData, setFormData] = useState({
    name: preset?.name ? `${preset.name} - Scheduled` : 'Scheduled Report',
    description: '',
    scheduleType: 'weekly' as 'daily' | 'weekly' | 'monthly',
    hour: '8',
    dayOfWeek: '1', // Monday
    dayOfMonth: '1',
    emailRecipients: [''],
  });

  const [isCreating, setIsCreating] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...formData.emailRecipients];
    newEmails[index] = value;
    setFormData(prev => ({ ...prev, emailRecipients: newEmails }));
  };

  const addEmailField = () => {
    setFormData(prev => ({
      ...prev,
      emailRecipients: [...prev.emailRecipients, '']
    }));
  };

  const removeEmailField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emailRecipients: prev.emailRecipients.filter((_, i) => i !== index)
    }));
  };

  const getScheduleDescription = () => {
    const { scheduleType, hour, dayOfWeek, dayOfMonth } = formData;
    const hourNum = parseInt(hour);
    const time = hourNum === 0 ? '12:00 AM' : 
                 hourNum < 12 ? `${hourNum}:00 AM` : 
                 hourNum === 12 ? '12:00 PM' : 
                 `${hourNum - 12}:00 PM`;

    switch (scheduleType) {
      case 'daily':
        return `Every day at ${time}`;
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Every ${days[parseInt(dayOfWeek)]} at ${time}`;
      case 'monthly':
        const suffix = parseInt(dayOfMonth) === 1 ? 'st' : 
                      parseInt(dayOfMonth) === 2 ? 'nd' : 
                      parseInt(dayOfMonth) === 3 ? 'rd' : 'th';
        return `Every ${dayOfMonth}${suffix} of the month at ${time}`;
      default:
        return '';
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Report name is required.',
        variant: 'destructive',
      });
      return;
    }

    const validEmails = formData.emailRecipients.filter(email => email.trim() !== '');
    if (validEmails.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one email recipient is required.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      const scheduleConfig = {
        hour: parseInt(formData.hour),
        ...(formData.scheduleType === 'weekly' && { day_of_week: parseInt(formData.dayOfWeek) }),
        ...(formData.scheduleType === 'monthly' && { day_of_month: parseInt(formData.dayOfMonth) }),
      };

      // Calculate next run time client-side
      const calculateNextRunTime = (scheduleType: string, scheduleConfig: any) => {
        const now = new Date();
        const hour = scheduleConfig.hour || 8;
        
        let nextRun = new Date();
        nextRun.setHours(hour, 0, 0, 0);
        
        switch (scheduleType) {
          case 'daily':
            if (nextRun <= now) {
              nextRun.setDate(nextRun.getDate() + 1);
            }
            break;
          case 'weekly':
            const dayOfWeek = scheduleConfig.day_of_week || 1; // Monday
            const daysUntilTarget = (dayOfWeek - nextRun.getDay() + 7) % 7;
            nextRun.setDate(nextRun.getDate() + (daysUntilTarget || 7));
            break;
          case 'monthly':
            const dayOfMonth = scheduleConfig.day_of_month || 1;
            nextRun.setDate(dayOfMonth);
            if (nextRun <= now) {
              nextRun.setMonth(nextRun.getMonth() + 1);
            }
            break;
        }
        
        return nextRun.toISOString();
      };

      const nextRunTime = calculateNextRunTime(formData.scheduleType, scheduleConfig);

      // Create scheduled report
      const { error } = await supabase
        .from('scheduled_reports')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          preset_id: preset?.id || null,
          created_by: user?.id,
          schedule_type: formData.scheduleType,
          schedule_config: scheduleConfig,
          email_recipients: validEmails,
          next_run_at: nextRunTime,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'Report Scheduled',
        description: `Report will be generated and emailed ${getScheduleDescription().toLowerCase()}.`,
      });

      onClose();

    } catch (error) {
      console.error('Failed to create scheduled report:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getFilterSummary = () => {
    const summary: string[] = [];
    
    if (filterData.dateRange) {
      summary.push('Date Range');
    }
    if (filterData.searchTerm) {
      summary.push('Search Term');
    }
    if (filterData.selectedDriver && filterData.selectedDriver !== 'all') {
      summary.push('Driver Filter');
    }
    if (filterData.selectedJobType && filterData.selectedJobType !== 'all') {
      summary.push('Job Type Filter');
    }
    if (filterData.selectedStatus && filterData.selectedStatus !== 'all') {
      summary.push('Status Filter');
    }
    
    return summary.length > 0 ? summary : ['No filters applied'];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Automated Report
          </DialogTitle>
          <DialogDescription>
            Create a recurring report that will be automatically generated and emailed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="report-name">Report Name</Label>
            <Input
              id="report-name"
              placeholder="Weekly Job Summary"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="report-description">Description (Optional)</Label>
            <Textarea
              id="report-description"
              placeholder="Describe what this report covers..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Schedule</Label>
              <Select
                value={formData.scheduleType}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                  setFormData(prev => ({ ...prev, scheduleType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Time</Label>
              <Select
                value={formData.hour}
                onValueChange={(value) => setFormData(prev => ({ ...prev, hour: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i === 0 ? '12:00 AM' : 
                       i < 12 ? `${i}:00 AM` : 
                       i === 12 ? '12:00 PM' : 
                       `${i - 12}:00 PM`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.scheduleType === 'weekly' && (
            <div>
              <Label>Day of Week</Label>
              <Select
                value={formData.dayOfWeek}
                onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.scheduleType === 'monthly' && (
            <div>
              <Label>Day of Month</Label>
              <Select
                value={formData.dayOfMonth}
                onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfMonth: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Recipients
            </Label>
            <div className="space-y-2">
              {formData.emailRecipients.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    type="email"
                  />
                  {formData.emailRecipients.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEmailField(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEmailField}
              >
                Add Another Email
              </Button>
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4" />
              <Label className="text-sm font-medium">Schedule Summary</Label>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {getScheduleDescription()}
            </p>
            <div className="flex flex-wrap gap-1">
              {getFilterSummary().map((filter, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {filter}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Schedule Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};