import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MapPin,
  ChevronRight,
  Wrench
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface TechnicianWorkOrderCardProps {
  workOrder: any;
  onRefresh: () => void;
}

export const TechnicianWorkOrderCard: React.FC<TechnicianWorkOrderCardProps> = ({ 
  workOrder, 
  onRefresh 
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const isOverdue = workOrder.due_date && new Date(workOrder.due_date) < new Date();

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const validStatus = newStatus as 'open' | 'awaiting_parts' | 'in_progress' | 'vendor' | 'on_hold' | 'ready_for_verification' | 'completed' | 'canceled';
      
      const { error } = await supabase
        .from('work_orders')
        .update({ 
          status: validStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', workOrder.id);

      if (error) throw error;

      // Add history entry
      await supabase.from('work_order_history').insert({
        work_order_id: workOrder.id,
        from_status: workOrder.status,
        to_status: newStatus,
        changed_by: 'technician',
        note: `Status changed from ${workOrder.status} to ${newStatus} via mobile`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-work-orders'] });
      toast({
        title: 'Status updated',
        description: 'Work order status has been updated successfully',
      });
      onRefresh();
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update work order status',
        variant: 'destructive',
      });
    },
  });

  const handleStartWork = () => {
    setIsUpdating(true);
    updateStatusMutation.mutate('in_progress');
    setTimeout(() => setIsUpdating(false), 1000);
  };

  const handleComplete = () => {
    navigate(`/technician/complete/${workOrder.id}`);
  };

  const handleViewDetails = () => {
    navigate(`/technician/details/${workOrder.id}`);
  };

  return (
    <Card className="overflow-hidden">
      {/* Priority Bar */}
      <div className={`h-2 ${getPriorityColor(workOrder.priority)}`} />

      {/* Card Content */}
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-foreground">
                {workOrder.work_order_number || `WO-${workOrder.id.slice(-8)}`}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {getPriorityLabel(workOrder.priority)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Wrench className="h-4 w-4" />
              {workOrder.asset_name || workOrder.asset_id}
            </p>
          </div>

          {isOverdue && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Overdue
            </Badge>
          )}
        </div>

        {/* Description */}
        {workOrder.description && (
          <p className="text-sm text-foreground line-clamp-2">
            {workOrder.description}
          </p>
        )}

        {/* Due Date */}
        {workOrder.due_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Due: {new Date(workOrder.due_date).toLocaleDateString()}</span>
          </div>
        )}

        {/* Out of Service Badge */}
        {workOrder.out_of_service && (
          <Badge variant="destructive" className="w-full justify-center py-2 text-sm">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Vehicle Out of Service
          </Badge>
        )}

        {/* Action Buttons - Large Touch Targets */}
        <div className="space-y-2 pt-2">
          {workOrder.status === 'open' || workOrder.status === 'awaiting_parts' ? (
            <>
              <Button
                onClick={handleStartWork}
                disabled={isUpdating || updateStatusMutation.isPending}
                className="w-full h-14 text-lg font-semibold"
                size="lg"
              >
                <Play className="h-6 w-6 mr-2" />
                Start Work
              </Button>
              <Button
                onClick={handleViewDetails}
                variant="outline"
                className="w-full h-12 text-base"
                size="lg"
              >
                View Details
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </>
          ) : workOrder.status === 'in_progress' ? (
            <>
              <Button
                onClick={handleComplete}
                className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <CheckCircle2 className="h-6 w-6 mr-2" />
                Complete Work Order
              </Button>
              <Button
                onClick={handleViewDetails}
                variant="outline"
                className="w-full h-12 text-base"
                size="lg"
              >
                View Details
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </>
          ) : (
            <Button
              onClick={handleViewDetails}
              variant="outline"
              className="w-full h-12 text-base"
              size="lg"
            >
              View Details
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
