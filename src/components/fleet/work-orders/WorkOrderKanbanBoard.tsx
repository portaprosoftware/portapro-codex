import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkOrderCard } from "./WorkOrderCard";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface WorkOrder {
  id: string;
  work_order_number: string;
  status: string;
  asset_name?: string;
  source: string;
  priority: string;
  assignee_name?: string;
  due_date?: string;
  opened_at: string;
  total_cost?: number;
  out_of_service?: boolean;
  description?: string;
}

interface WorkOrderKanbanBoardProps {
  workOrders: WorkOrder[];
  onEdit: (workOrder: WorkOrder) => void;
  onViewDetails: (workOrder: WorkOrder) => void;
  onStatusChange: (workOrderId: string, newStatus: string) => void;
}

const STATUS_COLUMNS = [
  { id: 'open', label: 'Open', color: 'hsl(var(--destructive))' },
  { id: 'awaiting_parts', label: 'Awaiting Parts', color: 'hsl(var(--warning))' },
  { id: 'in_progress', label: 'In Progress', color: 'hsl(var(--primary))' },
  { id: 'vendor', label: 'Vendor', color: 'hsl(var(--secondary))' },
  { id: 'on_hold', label: 'On Hold', color: 'hsl(var(--muted))' },
  { id: 'ready_for_verification', label: 'Ready for Verification', color: 'hsl(var(--success))' },
  { id: 'completed', label: 'Completed', color: 'hsl(var(--muted))' }
];

export const WorkOrderKanbanBoard: React.FC<WorkOrderKanbanBoardProps> = ({
  workOrders,
  onEdit,
  onViewDetails,
  onStatusChange
}) => {
  const getWorkOrdersByStatus = (status: string) => {
    return workOrders.filter(wo => wo.status === status);
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    onStatusChange(draggableId, destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-2">
        {/* Column Headers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {STATUS_COLUMNS.map((column) => {
            const columnWorkOrders = getWorkOrdersByStatus(column.id);
            
            return (
              <div key={`header-${column.id}`} className="flex flex-col items-center gap-1">
                <h3 className="font-semibold text-sm text-foreground text-center">
                  {column.label}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {columnWorkOrders.length}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 min-h-[600px]">
          {STATUS_COLUMNS.map((column) => {
            const columnWorkOrders = getWorkOrdersByStatus(column.id);
            
            return (
              <Card key={column.id} className="flex flex-col">
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <CardContent 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-3 p-3 min-h-[500px] ${
                        snapshot.isDraggingOver ? 'bg-muted/50' : ''
                      }`}
                    >
                      {columnWorkOrders.map((workOrder, index) => (
                        <Draggable 
                          key={workOrder.id} 
                          draggableId={workOrder.id} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`${
                                snapshot.isDragging ? 'opacity-50' : ''
                              }`}
                            >
                              <WorkOrderCard
                                workOrder={workOrder}
                                onEdit={onEdit}
                                onViewDetails={onViewDetails}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {columnWorkOrders.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No work orders
                        </div>
                      )}
                    </CardContent>
                  )}
                </Droppable>
              </Card>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
};