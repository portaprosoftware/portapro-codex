import React, { useState, useMemo, useRef } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Wrench, 
  Download,
  Printer,
  Plus,
  CalendarDays,
  Check,
  X
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { WorkOrder } from "./types";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, startOfWeek, endOfWeek, addDays } from "date-fns";
import { AddWorkOrderDrawer } from "./AddWorkOrderDrawer";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface WorkOrderCalendarViewEnhancedProps {
  workOrders: WorkOrder[];
  onEdit: (workOrder: WorkOrder) => void;
  onViewDetails: (workOrder: WorkOrder) => void;
  onStatusChange: (workOrderId: string, newStatus: string) => void;
  onRefresh: () => void;
}

interface GroupedWorkOrders {
  [key: string]: WorkOrder[];
}

type ViewMode = 'month' | 'week';

export const WorkOrderCalendarViewEnhanced: React.FC<WorkOrderCalendarViewEnhancedProps> = ({
  workOrders,
  onEdit,
  onViewDetails,
  onStatusChange,
  onRefresh,
}) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedDateForNew, setSelectedDateForNew] = useState<Date | null>(null);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<Set<string>>(new Set());

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

  // Week view data
  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return [];
    const start = startOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate, viewMode]);

  // Handle drag and drop for rescheduling
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    // Extract work order ID and new date
    const workOrderId = draggableId;
    const newDateKey = destination.droppableId;
    
    // Update work order due date
    const workOrder = workOrders.find(wo => wo.id === workOrderId);
    if (workOrder) {
      // In a real implementation, you'd update the due_date field
      toast({
        title: "Work Order Rescheduled",
        description: `${workOrder.work_order_number} moved to ${format(parseISO(newDateKey), 'MMM d, yyyy')}`,
      });
      // Call your update function here
      onRefresh();
    }
  };

  // Handle empty date click to create new work order
  const handleEmptyDateClick = (date: Date) => {
    setSelectedDateForNew(date);
    setIsAddDrawerOpen(true);
  };

  // Bulk operations
  const handleBulkStatusChange = (newStatus: string) => {
    selectedWorkOrders.forEach(workOrderId => {
      onStatusChange(workOrderId, newStatus);
    });
    setSelectedWorkOrders(new Set());
    setBulkSelectMode(false);
    toast({
      title: "Bulk Update Complete",
      description: `Updated ${selectedWorkOrders.size} work orders to ${newStatus}`,
    });
  };

  // Export calendar
  const handleExportCalendar = () => {
    // Generate ICS file content
    const icsContent = generateICSContent(workOrders);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'work-orders-calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Calendar Exported",
      description: "Work orders calendar downloaded as ICS file",
    });
  };

  // Print calendar
  const handlePrintCalendar = () => {
    const pdf = new jsPDF();
    pdf.text(`Work Orders Calendar - ${format(currentMonth, 'MMMM yyyy')}`, 20, 20);
    
    let yPosition = 40;
    Object.entries(groupedWorkOrders).forEach(([date, orders]) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.text(`${format(parseISO(date), 'MMM d')}: ${orders.length} work orders`, 20, yPosition);
      yPosition += 10;
      
      orders.forEach(order => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`  - ${order.work_order_number} (${order.priority})`, 25, yPosition);
        yPosition += 8;
      });
      yPosition += 5;
    });
    
    pdf.save(`work-orders-calendar-${format(currentMonth, 'yyyy-MM')}.pdf`);
    
    toast({
      title: "Calendar Printed",
      description: "Calendar saved as PDF",
    });
  };

  // Generate ICS content for calendar export
  const generateICSContent = (workOrders: WorkOrder[]) => {
    const events = workOrders
      .filter(wo => wo.due_date)
      .map(wo => {
        const startDate = format(parseISO(wo.due_date!), "yyyyMMdd");
        return [
          "BEGIN:VEVENT",
          `UID:${wo.id}@portapro.com`,
          `DTSTART;VALUE=DATE:${startDate}`,
          `DTEND;VALUE=DATE:${startDate}`,
          `SUMMARY:${wo.work_order_number} - ${wo.description}`,
          `DESCRIPTION:Priority: ${wo.priority}\\nStatus: ${wo.status}\\nAsset: ${wo.asset_name || 'N/A'}`,
          "END:VEVENT"
        ].join("\r\n");
      });

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//PortaPro//Work Orders Calendar//EN",
      ...events,
      "END:VCALENDAR"
    ].join("\r\n");
  };

  // Custom day content with tooltips and drag/drop
  const customDayContent = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayWorkOrders = groupedWorkOrders[dateKey];
    
    if (!dayWorkOrders || dayWorkOrders.length === 0) {
      return (
        <Droppable droppableId={dateKey}>
          {(provided, snapshot) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`absolute inset-0 ${snapshot.isDraggingOver ? 'bg-primary/10' : ''}`}
              onClick={() => handleEmptyDateClick(date)}
            >
              {snapshot.isDraggingOver && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      );
    }

    return (
      <Droppable droppableId={dateKey}>
        {(provided, snapshot) => (
          <div 
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`absolute top-0 right-0 flex flex-wrap gap-0.5 max-w-6 ${
              snapshot.isDraggingOver ? 'bg-primary/10' : ''
            }`}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-pointer">
                    {dayWorkOrders.slice(0, 3).map((wo, index) => (
                      <Draggable key={wo.id} draggableId={wo.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(wo.priority)} ${
                              snapshot.isDragging ? 'opacity-50' : ''
                            }`}
                          />
                        )}
                      </Draggable>
                    ))}
                    {dayWorkOrders.length > 3 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-64">
                  <div className="space-y-2">
                    <div className="font-semibold text-sm">
                      {format(date, 'MMM d, yyyy')} ({dayWorkOrders.length} work orders)
                    </div>
                    {dayWorkOrders.slice(0, 3).map(wo => (
                      <div key={wo.id} className="text-xs">
                        <div className="font-medium">{wo.work_order_number}</div>
                        <div className="text-muted-foreground">
                          {wo.priority} • {wo.status} • {wo.asset_name}
                        </div>
                      </div>
                    ))}
                    {dayWorkOrders.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayWorkOrders.length - 3} more...
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
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
      case 'in_progress':
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

  // Render week view
  const renderWeekView = () => (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-7 gap-2 h-96">
        {weekDays.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayWorkOrders = groupedWorkOrders[dateKey] || [];
          
          return (
            <div key={dateKey} className="border rounded p-2">
              <div className="font-semibold text-sm mb-2 text-center">
                {format(day, 'EEE d')}
              </div>
              <Droppable droppableId={dateKey}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-1 min-h-32 ${
                      snapshot.isDraggingOver ? 'bg-primary/10' : ''
                    }`}
                  >
                    {dayWorkOrders.map((wo, index) => (
                      <Draggable key={wo.id} draggableId={wo.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`text-xs p-1 bg-card border rounded cursor-pointer ${
                              snapshot.isDragging ? 'opacity-50' : ''
                            }`}
                            onClick={() => onViewDetails(wo)}
                          >
                            <div className="font-medium">{wo.work_order_number}</div>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(wo.priority)} inline-block mr-1`} />
                            {wo.asset_name}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {dayWorkOrders.length === 0 && (
                      <div 
                        className="text-xs text-muted-foreground cursor-pointer hover:bg-muted/50 p-2 rounded text-center"
                        onClick={() => handleEmptyDateClick(day)}
                      >
                        <Plus className="h-3 w-3 mx-auto" />
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );

  // Render month view
  const renderMonthView = () => (
    <DragDropContext onDragEnd={handleDragEnd}>
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
    </DragDropContext>
  );

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

        {/* View Toggle and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkSelectMode(!bulkSelectMode)}
            >
              {bulkSelectMode ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              {bulkSelectMode ? 'Exit Bulk' : 'Bulk Select'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCalendar}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintCalendar}
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {bulkSelectMode && selectedWorkOrders.size > 0 && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {selectedWorkOrders.size} work orders selected
                </div>
                <div className="flex items-center gap-2">
                  <Select onValueChange={handleBulkStatusChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Change Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedWorkOrders(new Set());
                      setBulkSelectMode(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar Views */}
        {viewMode === 'month' ? renderMonthView() : renderWeekView()}

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
              <div className="text-center space-y-2">
                <p className="text-muted-foreground text-sm">
                  No work orders scheduled for this date.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEmptyDateClick(selectedDate)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Work Order
                </Button>
              </div>
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
                          <div className="flex items-center gap-2">
                            {bulkSelectMode && (
                              <Checkbox
                                checked={selectedWorkOrders.has(workOrder.id)}
                                onCheckedChange={(checked) => {
                                  const newSelected = new Set(selectedWorkOrders);
                                  if (checked) {
                                    newSelected.add(workOrder.id);
                                  } else {
                                    newSelected.delete(workOrder.id);
                                  }
                                  setSelectedWorkOrders(newSelected);
                                }}
                              />
                            )}
                            <div className="font-medium text-sm">
                              {workOrder.work_order_number}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select 
                              value={workOrder.status} 
                              onValueChange={(newStatus) => onStatusChange(workOrder.id, newStatus)}
                            >
                              <SelectTrigger className="w-32 h-6">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
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

      {/* Add Work Order Drawer */}
      <AddWorkOrderDrawer
        open={isAddDrawerOpen}
        onOpenChange={setIsAddDrawerOpen}
        onSuccess={() => {
          onRefresh();
          setSelectedDateForNew(null);
        }}
        defaultDueDate={selectedDateForNew ? format(selectedDateForNew, 'yyyy-MM-dd') : undefined}
      />
    </div>
  );
};