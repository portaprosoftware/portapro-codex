import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, AlertTriangle, User, MoreVertical } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { getStatusBadgeVariant } from "@/lib/statusBadgeUtils";

interface WorkOrderCardProps {
  workOrder: {
    id: string;
    work_order_number: string;
    asset_name?: string;
    source: string;
    priority: string;
    status: string;
    assignee_name?: string;
    due_date?: string;
    opened_at: string;
    total_cost?: number;
    out_of_service?: boolean;
    description?: string;
  };
  onEdit: (workOrder: any) => void;
  onViewDetails: (workOrder: any) => void;
}

export const WorkOrderCard: React.FC<WorkOrderCardProps> = ({
  workOrder,
  onEdit,
  onViewDetails
}) => {
  const getDaysOverdue = () => {
    if (!workOrder.due_date) return 0;
    const dueDate = new Date(workOrder.due_date);
    const today = new Date();
    return differenceInDays(today, dueDate);
  };

  const getAgingBadge = () => {
    const daysOpen = differenceInDays(new Date(), new Date(workOrder.opened_at));
    if (daysOpen < 3) return null;
    
    if (daysOpen > 14) {
      return <Badge variant="destructive" className="text-xs">Critical Age</Badge>;
    } else if (daysOpen > 7) {
      return <Badge variant="secondary" className="text-xs">Aging</Badge>;
    }
    return null;
  };

  const getPriorityColor = () => {
    switch (workOrder.priority) {
      case 'critical': return 'hsl(var(--destructive))';
      case 'high': return 'hsl(var(--warning))';
      case 'normal': return 'hsl(var(--primary))';
      case 'low': return 'hsl(var(--muted))';
      default: return 'hsl(var(--muted))';
    }
  };

  const getSourceBadge = () => {
    const sourceLabels = {
      dvir_defect: 'DVIR',
      pm_schedule: 'PM',
      breakdown: 'Breakdown',
      recall: 'Recall',
      other: 'Other'
    };
    return sourceLabels[workOrder.source as keyof typeof sourceLabels] || workOrder.source;
  };

  return (
    <Card className="relative group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Priority indicator */}
        <div 
          className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
          style={{ backgroundColor: getPriorityColor() }}
        />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">
                {workOrder.work_order_number}
              </h3>
              <Badge variant="outline" className="text-xs">
                {getSourceBadge()}
              </Badge>
              <Badge variant={getStatusBadgeVariant(workOrder.priority as any)} className="text-xs capitalize">
                {workOrder.priority}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {workOrder.asset_name || 'No asset assigned'}
            </p>
          </div>
          
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
            <MoreVertical className="h-3 w-3" />
          </Button>
        </div>

        {/* Status and flags */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={getStatusBadgeVariant(workOrder.status as any)} className="text-xs">
            {workOrder.status.replace(/_/g, ' ')}
          </Badge>
          {workOrder.out_of_service && (
            <Badge variant="destructive" className="text-xs">
              OOS
            </Badge>
          )}
          {getAgingBadge()}
        </div>

        {/* Description */}
        {workOrder.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {workOrder.description}
          </p>
        )}

        {/* Assignee and due date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            {workOrder.assignee_name ? (
              <>
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-[10px]">
                    {workOrder.assignee_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-16">{workOrder.assignee_name}</span>
              </>
            ) : (
              <>
                <User className="h-3 w-3" />
                <span>Unassigned</span>
              </>
            )}
          </div>
          
          {workOrder.due_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className={getDaysOverdue() > 0 ? 'text-destructive font-medium' : ''}>
                {getDaysOverdue() > 0 
                  ? `${getDaysOverdue()}d overdue`
                  : `Due ${format(new Date(workOrder.due_date), 'MMM d')}`
                }
              </span>
            </div>
          )}
        </div>

        {/* Cost and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span>${(workOrder.total_cost || 0).toLocaleString()}</span>
          </div>
          
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => onEdit(workOrder)}
            >
              Edit
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => onViewDetails(workOrder)}
            >
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};