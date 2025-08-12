import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, User, FileText, Edit, Eye } from 'lucide-react';
import { WorkOrder } from './types';
import { getStatusBadgeVariant } from '@/lib/statusBadgeUtils';

interface WorkOrderListViewProps {
  workOrders: WorkOrder[];
  onEdit: (workOrder: WorkOrder) => void;
  onViewDetails: (workOrder: WorkOrder) => void;
  onStatusChange?: (workOrderId: string, newStatus: string) => void;
}

export const WorkOrderListView: React.FC<WorkOrderListViewProps> = ({
  workOrders,
  onEdit,
  onViewDetails,
  onStatusChange
}) => {
  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      'Low': 'bg-green-100 text-green-800 border-green-200',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'High': 'bg-orange-100 text-orange-800 border-orange-200',
      'Critical': 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <Badge className={`${priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'} text-xs`}>
        {priority}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const sourceColors = {
      'DVIR': 'bg-blue-100 text-blue-800 border-blue-200',
      'PM': 'bg-purple-100 text-purple-800 border-purple-200',
      'Breakdown': 'bg-red-100 text-red-800 border-red-200',
      'Other': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return (
      <Badge className={`${sourceColors[source as keyof typeof sourceColors] || 'bg-gray-100 text-gray-800'} text-xs`}>
        {source}
      </Badge>
    );
  };

  const getDaysOverdue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getAgingBadge = (workOrder: WorkOrder) => {
    if (!workOrder.due_date) return null;
    
    const daysOverdue = getDaysOverdue(workOrder.due_date);
    if (daysOverdue <= 0) return null;

    const agingColors = {
      1: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      7: 'bg-orange-100 text-orange-800 border-orange-200',
      30: 'bg-red-100 text-red-800 border-red-200'
    };

    let colorClass = agingColors[1];
    if (daysOverdue >= 30) colorClass = agingColors[30];
    else if (daysOverdue >= 7) colorClass = agingColors[7];

    return (
      <Badge className={`${colorClass} text-xs`}>
        {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
      </Badge>
    );
  };

  if (workOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">No work orders found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          No work orders match your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workOrders.map((workOrder) => (
        <Card key={workOrder.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              {/* Header Row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold text-lg">{workOrder.work_order_number}</h3>
                  {getPriorityBadge(workOrder.priority)}
                  {getSourceBadge(workOrder.source)}
                  <Badge variant={getStatusBadgeVariant(workOrder.status as any)}>
                    {workOrder.status}
                  </Badge>
                  {workOrder.out_of_service && (
                    <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                      Out of Service
                    </Badge>
                  )}
                  {getAgingBadge(workOrder)}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(workOrder)}
                    className="flex items-center space-x-1"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(workOrder)}
                    className="flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </Button>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Asset</p>
                    <p className="text-sm text-muted-foreground">
                      {workOrder.asset_name || `${workOrder.asset_type} - ${workOrder.asset_id}`}
                    </p>
                  </div>
                </div>

                {workOrder.assignee_name && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Assignee</p>
                      <p className="text-sm text-muted-foreground">{workOrder.assignee_name}</p>
                    </div>
                  </div>
                )}

                {workOrder.due_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Due Date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(workOrder.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {workOrder.total_cost && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Cost</p>
                      <p className="text-sm text-muted-foreground">
                        ${workOrder.total_cost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {workOrder.description && (
                <div>
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {workOrder.description}
                  </p>
                </div>
              )}

              {/* Tasks */}
              {workOrder.tasks && workOrder.tasks.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Tasks ({workOrder.tasks.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {workOrder.tasks.slice(0, 3).map((task, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {task}
                      </Badge>
                    ))}
                    {workOrder.tasks.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{workOrder.tasks.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};