import React, { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Wrench } from "lucide-react";
import { WorkOrder } from "./types";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";

interface WorkOrderCalendarViewProps {
  workOrders: WorkOrder[];
  onEdit: (workOrder: WorkOrder) => void;
  onViewDetails: (workOrder: WorkOrder) => void;
  onStatusChange: (workOrderId: string, newStatus: string) => void;
}

interface GroupedWorkOrders {
  [key: string]: WorkOrder[];
}

export const WorkOrderCalendarView: React.FC<WorkOrderCalendarViewProps> = ({
  workOrders,
  onEdit,
  onViewDetails,
  onStatusChange,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Group work orders by due date
  const groupedWorkOrders = useMemo((): GroupedWorkOrders => {
    const grouped: GroupedWorkOrders = {};
    
    workOrders.forEach((workOrder) => {
      if (workOrder.due_date) {
        const dateKey = format(parseISO(workOrder.due_date), 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(workOrder);
      }
    });
    
    return grouped;
  }, [workOrders]);

  // Work orders without due dates
  const workOrdersWithoutDueDate = useMemo(() => {
    return workOrders.filter(wo => !wo.due_date);
  }, [workOrders]);

  // Get work orders for selected date
  const selectedDateWorkOrders = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return groupedWorkOrders[dateKey] || [];
  }, [selectedDate, groupedWorkOrders]);

  // Custom day content to show work order indicators
  const customDayContent = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayWorkOrders = groupedWorkOrders[dateKey];
    
    if (!dayWorkOrders || dayWorkOrders.length === 0) {
      return null;
    }

    return (
      <div className="absolute top-0 right-0 flex flex-wrap gap-0.5 max-w-6">
        {dayWorkOrders.slice(0, 3).map((wo, index) => (
          <div
            key={wo.id}
            className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(wo.priority)}`}
          />
        ))}
        {dayWorkOrders.length > 3 && (
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
        )}
      </div>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-destructive';
      case 'medium':
        return 'bg-warning';
      case 'low':
        return 'bg-success';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'in-progress':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'pending':
        return 'bg-muted/10 text-muted-foreground border-muted/20';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Calendar Section */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="w-full"
              modifiers={{
                hasWorkOrders: (date) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  return !!groupedWorkOrders[dateKey]?.length;
                },
              }}
              modifiersStyles={{
                hasWorkOrders: {
                  fontWeight: 'bold',
                  position: 'relative',
                },
              }}
              components={{
                Day: ({ date, displayMonth }) => (
                  <div className="relative">
                    <div>
                      {format(date, 'd')}
                      {customDayContent(date)}
                    </div>
                  </div>
                ),
              }}
            />
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Priority Legend</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span>High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span>Medium Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span>Low Priority</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Date Details */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDateWorkOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No work orders scheduled for this date.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  {selectedDateWorkOrders.length} work order{selectedDateWorkOrders.length !== 1 ? 's' : ''} scheduled
                </p>
                {selectedDateWorkOrders.map((workOrder) => (
                  <Card key={workOrder.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {workOrder.work_order_number}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline"
                              className={getStatusColor(workOrder.status)}
                            >
                              {workOrder.status}
                            </Badge>
                            <Badge variant="outline" className={`${getPriorityColor(workOrder.priority)} text-white border-transparent`}>
                              {workOrder.priority}
                            </Badge>
                          </div>
                        </div>
                        {isOverdue(workOrder.due_date!) && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        {workOrder.asset_name && (
                          <div className="flex items-center gap-1">
                            <Wrench className="h-3 w-3" />
                            <span>{workOrder.asset_name}</span>
                          </div>
                        )}
                        {workOrder.assignee_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{workOrder.assignee_name}</span>
                          </div>
                        )}
                        {workOrder.total_cost && (
                          <div className="flex items-center gap-1">
                            <span className="font-mono">${workOrder.total_cost.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {workOrder.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {workOrder.description}
                        </p>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => onViewDetails(workOrder)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => onEdit(workOrder)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work Orders Without Due Date */}
        {workOrdersWithoutDueDate.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                No Due Date ({workOrdersWithoutDueDate.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {workOrdersWithoutDueDate.slice(0, 5).map((workOrder) => (
                <div key={workOrder.id} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                  <span className="font-medium">{workOrder.work_order_number}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => onViewDetails(workOrder)}
                  >
                    View
                  </Button>
                </div>
              ))}
              {workOrdersWithoutDueDate.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{workOrdersWithoutDueDate.length - 5} more
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};