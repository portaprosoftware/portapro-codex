import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Play, Pause, Trash2, AlertCircle, CheckCircle, Clock, Plus } from 'lucide-react';
import { AddWorkOrderDrawer } from '../work-orders/AddWorkOrderDrawer';
import { AssignPMTemplateDialog } from './AssignPMTemplateDialog';

interface ActivePMSchedulesListProps {
  vehicleId?: string;
}

export const ActivePMSchedulesList: React.FC<ActivePMSchedulesListProps> = ({ vehicleId }) => {
  const [selectedScheduleForWO, setSelectedScheduleForWO] = useState<any>(null);
  const [isWorkOrderDrawerOpen, setIsWorkOrderDrawerOpen] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all PM templates for assignment
  const { data: templates } = useQuery({
    queryKey: ['pm-templates-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pm_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['vehicle-pm-schedules', vehicleId],
    queryFn: async () => {
      let query = supabase
        .from('vehicle_pm_schedules' as any)
        .select(`
          *,
          pm_templates (
            id,
            name,
            description,
            trigger_type,
            trigger_interval,
            estimated_cost,
            estimated_labor_hours
          ),
          vehicles (
            id,
            license_plate,
            vehicle_type
          )
        `)
        .eq('active', true)
        .order('next_due_date', { ascending: true });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000 // Cache for 30 seconds to reduce load time
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('vehicle_pm_schedules' as any)
        .update({ active, status: active ? 'active' : 'paused' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-pm-schedules'] });
      toast.success('Schedule updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicle_pm_schedules' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-pm-schedules'] });
      toast.success('Schedule deleted');
    }
  });

  const getStatusBadge = (schedule: any) => {
    const today = new Date();
    const dueDate = schedule?.next_due_date ? new Date(schedule.next_due_date) : null;

    if (!dueDate) {
      return <Badge variant="secondary">No Due Date</Badge>;
    }

    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          Overdue ({Math.abs(diffDays)} days)
        </Badge>
      );
    } else if (diffDays <= 7) {
      return (
        <Badge variant="default" className="gap-1 bg-yellow-500">
          <Clock className="w-3 h-3" />
          Due Soon ({diffDays} days)
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="gap-1">
          <CheckCircle className="w-3 h-3" />
          On Track ({diffDays} days)
        </Badge>
      );
    }
  };

  const handleCreateWorkOrder = (schedule: any) => {
    setSelectedScheduleForWO(schedule);
    setIsWorkOrderDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <>
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Active PM Schedules</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Assign PM templates to vehicles to start tracking maintenance schedules
            </p>
            {templates && templates.length > 0 ? (
              <Button 
                onClick={() => setShowAssignDialog(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Assign PM Schedule
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Create PM templates first in the "PM Templates" tab
              </p>
            )}
          </CardContent>
        </Card>
        
        {showAssignDialog && templates && templates[0] && (
          <AssignPMTemplateDialog 
            template={templates[0]} 
            onOpenChange={setShowAssignDialog}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Active PM Schedules</h3>
          <p className="text-sm text-muted-foreground">
            {schedules.length} schedule{schedules.length !== 1 ? 's' : ''} active
          </p>
        </div>
        {templates && templates.length > 0 && (
          <Button 
            onClick={() => setShowAssignDialog(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Assign PM Schedule
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {(schedules as any[])?.map((schedule: any) => (
          <Card key={schedule.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {schedule.pm_templates?.name || 'Unknown Template'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {schedule.vehicles?.license_plate} ({schedule.vehicles?.vehicle_type})
                  </p>
                </div>
                {getStatusBadge(schedule)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {schedule.next_due_date && (
                  <div>
                    <p className="text-xs text-muted-foreground">Next Due Date</p>
                    <p className="font-semibold">
                      {new Date(schedule.next_due_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {schedule.next_due_mileage && (
                  <div>
                    <p className="text-xs text-muted-foreground">Next Due Mileage</p>
                    <p className="font-semibold">{schedule.next_due_mileage.toLocaleString()} mi</p>
                  </div>
                )}
                {schedule.next_due_engine_hours && (
                  <div>
                    <p className="text-xs text-muted-foreground">Next Due Hours</p>
                    <p className="font-semibold">{schedule.next_due_engine_hours} hrs</p>
                  </div>
                )}
                {schedule.pm_templates?.estimated_cost && (
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Cost</p>
                    <p className="font-semibold">${schedule.pm_templates.estimated_cost}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleCreateWorkOrder(schedule)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Create Work Order
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toggleActiveMutation.mutate({
                      id: schedule.id,
                      active: !schedule.active
                    })
                  }
                >
                  {schedule.active ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Delete this PM schedule?')) {
                      deleteMutation.mutate(schedule.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showAssignDialog && templates && templates[0] && (
        <AssignPMTemplateDialog 
          template={templates[0]} 
          onOpenChange={setShowAssignDialog}
        />
      )}

      {selectedScheduleForWO && (
        <AddWorkOrderDrawer
          open={isWorkOrderDrawerOpen}
          onOpenChange={setIsWorkOrderDrawerOpen}
          onSuccess={() => {
            setIsWorkOrderDrawerOpen(false);
            setSelectedScheduleForWO(null);
          }}
          vehicleContextId={selectedScheduleForWO.vehicle_id}
          pmTemplate={selectedScheduleForWO.pm_templates}
        />
      )}
    </>
  );
};
