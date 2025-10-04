import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Calendar, Gauge, AlertCircle, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface NextPMDueWidgetProps {
  vehicleId: string;
  currentOdometer?: number;
  currentEngineHours?: number;
  onCreateWorkOrder?: (templateId: string, scheduleId: string) => void;
}

export const NextPMDueWidget: React.FC<NextPMDueWidgetProps> = ({
  vehicleId,
  currentOdometer = 0,
  currentEngineHours = 0,
  onCreateWorkOrder
}) => {
  // Fetch active PM schedules for this vehicle
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['vehicle-pm-schedules', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_pm_schedules' as any)
        .select('*')
        .eq('vehicle_id', vehicleId)
        .eq('active', true)
        .order('next_due_date', { ascending: true });
      
      if (error) throw error;
      
      // Fetch templates separately
      if (data && data.length > 0) {
        const templateIds = data.map((s: any) => s.template_id).filter(Boolean);
        if (templateIds.length > 0) {
          const { data: templates, error: templatesError } = await supabase
            .from('pm_templates' as any)
            .select('id, name, asset_type')
            .in('id', templateIds);
          
          if (!templatesError && templates) {
            // Merge templates into schedules
            return data.map((schedule: any) => ({
              ...schedule,
              pm_template: templates.find((t: any) => t.id === schedule.template_id)
            }));
          }
        }
      }
      
      return data || [];
    }
  });

  const calculateProgress = (schedule: any): { percent: number; remaining: number; unit: string } => {
    // Check which trigger will come first
    const triggers = [];

    // Mileage trigger
    if (schedule.next_due_mileage && currentOdometer) {
      const milesRemaining = schedule.next_due_mileage - currentOdometer;
      const baselineMileage = schedule.baseline_mileage || 0;
      const totalInterval = schedule.next_due_mileage - baselineMileage;
      const progress = totalInterval > 0 ? Math.max(0, Math.min(100, ((totalInterval - milesRemaining) / totalInterval) * 100)) : 0;
      triggers.push({ percent: progress, remaining: milesRemaining, unit: 'mi', priority: 1 });
    }

    // Engine hours trigger
    if (schedule.next_due_engine_hours && currentEngineHours) {
      const hoursRemaining = schedule.next_due_engine_hours - currentEngineHours;
      const baselineHours = schedule.baseline_engine_hours || 0;
      const totalInterval = schedule.next_due_engine_hours - baselineHours;
      const progress = totalInterval > 0 ? Math.max(0, Math.min(100, ((totalInterval - hoursRemaining) / totalInterval) * 100)) : 0;
      triggers.push({ percent: progress, remaining: hoursRemaining, unit: 'hr', priority: 2 });
    }

    // Days trigger
    if (schedule.next_due_date) {
      const dueDate = new Date(schedule.next_due_date);
      const now = new Date();
      const baselineDate = schedule.baseline_date ? new Date(schedule.baseline_date) : now;
      const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const totalInterval = Math.ceil((dueDate.getTime() - baselineDate.getTime()) / (1000 * 60 * 60 * 24));
      const progress = totalInterval > 0 ? Math.max(0, Math.min(100, ((totalInterval - daysRemaining) / totalInterval) * 100)) : 0;
      triggers.push({ percent: progress, remaining: daysRemaining, unit: 'days', priority: 3 });
    }

    // Return the trigger closest to due (highest progress)
    triggers.sort((a, b) => b.percent - a.percent);
    return triggers[0] || { percent: 0, remaining: 0, unit: '' };
  };

  const getStatusColor = (percent: number, remaining: number): string => {
    if (remaining < 0) return "text-red-600"; // Overdue
    if (percent >= 80) return "text-yellow-600"; // Due soon
    return "text-green-600"; // OK
  };

  const getStatusBadge = (percent: number, remaining: number): { variant: any; label: string } => {
    if (remaining < 0) return { variant: "destructive", label: "Overdue" };
    if (percent >= 80) return { variant: "secondary", label: "Due Soon" };
    return { variant: "outline", label: "OK" };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Next PM Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Next PM Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No PM schedules configured</p>
          <Button variant="outline" size="sm" className="mt-2 w-full text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add PM Schedule
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Get the next due PM (first in sorted list)
  const nextPM = schedules[0];
  const progress = calculateProgress(nextPM);
  const status = getStatusBadge(progress.percent, progress.remaining);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Next PM Due
          </CardTitle>
          <Badge variant={status.variant} className="text-xs">
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* PM Template name */}
        <div>
          <div className="font-medium text-sm">{nextPM.pm_template?.name || 'PM Service'}</div>
          <div className="text-xs text-muted-foreground">{nextPM.pm_template?.asset_type || ''}</div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className={getStatusColor(progress.percent, progress.remaining)}>
              {progress.remaining > 0 ? `${progress.remaining} ${progress.unit}` : 'Overdue'}
            </span>
          </div>
          <Progress 
            value={progress.percent} 
            className="h-2"
          />
        </div>

        {/* Due date/mileage details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {nextPM.next_due_mileage && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Gauge className="h-3 w-3" />
              <span>{nextPM.next_due_mileage.toLocaleString()} mi</span>
            </div>
          )}
          {nextPM.next_due_date && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(nextPM.next_due_date), { addSuffix: true })}</span>
            </div>
          )}
        </div>

        {/* Action button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs"
          onClick={() => onCreateWorkOrder?.(nextPM.template_id, nextPM.id)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Create Work Order
        </Button>

        {/* Show all scheduled PMs count */}
        {schedules.length > 1 && (
          <div className="text-xs text-center text-muted-foreground pt-2 border-t">
            +{schedules.length - 1} more PM{schedules.length > 2 ? 's' : ''} scheduled
          </div>
        )}
      </CardContent>
    </Card>
  );
};
