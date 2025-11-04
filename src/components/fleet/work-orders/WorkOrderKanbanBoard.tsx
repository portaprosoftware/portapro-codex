import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  technician_signature_id?: string | null;
  reviewer_signature_id?: string | null;
}

interface WorkOrderKanbanBoardProps {
  workOrders: WorkOrder[];
  onEdit: (workOrder: WorkOrder) => void;
  onViewDetails: (workOrder: WorkOrder) => void;
  onStatusChange: (workOrderId: string, newStatus: string) => void;
  onBulkAction?: (action: string, workOrderIds: string[]) => void;
  selectedWorkOrderIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const STATUS_COLUMNS = [
  { id: 'open', label: 'Open', color: 'hsl(var(--destructive))' },
  { id: 'awaiting_parts', label: 'Awaiting Parts', color: 'hsl(var(--warning))' },
  { id: 'in_progress', label: 'In Progress', color: 'hsl(var(--primary))' },
  { id: 'vendor', label: 'Vendor', color: 'hsl(var(--secondary))' },
  { id: 'on_hold', label: 'On Hold', color: 'hsl(var(--muted))' },
  { id: 'ready_for_verification', label: 'Verification', color: 'hsl(var(--success))' },
  { id: 'completed', label: 'Completed', color: 'hsl(var(--muted))' }
];

export const WorkOrderKanbanBoard: React.FC<WorkOrderKanbanBoardProps> = ({
  workOrders,
  onEdit,
  onViewDetails,
  onStatusChange,
  onBulkAction,
  selectedWorkOrderIds = [],
  onSelectionChange
}) => {
  const [selectionMode, setSelectionMode] = useState(false);

  const getWorkOrdersByStatus = (status: string) => {
    return workOrders.filter(wo => wo.status === status);
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    onStatusChange(draggableId, destination.droppableId);
  };

  const handleSelectWorkOrder = (workOrderId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      onSelectionChange([...selectedWorkOrderIds, workOrderId]);
    } else {
      onSelectionChange(selectedWorkOrderIds.filter(id => id !== workOrderId));
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode && onSelectionChange) {
      onSelectionChange([]);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-2">
        {/* Selection Mode Toggle */}
        {onBulkAction && (
          <div className="flex items-center gap-2 mb-4 bg-muted/50 p-3 rounded-lg">
            <Checkbox
              checked={selectionMode}
              onCheckedChange={toggleSelectionMode}
            />
            <span className="text-sm font-medium">
              {selectionMode ? 'Exit Selection Mode' : 'Enable Selection Mode'}
            </span>
            {selectionMode && selectedWorkOrderIds.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedWorkOrderIds.length} selected
              </Badge>
            )}
          </div>
        )}

        {/* Column Headers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {STATUS_COLUMNS.map((column) => {
            const columnWorkOrders = getWorkOrdersByStatus(column.id);
            
            return (
              <div key={`header-${column.id}`} className="flex flex-col items-center gap-1">
                <Badge variant="secondary" className="text-xs">
                  {columnWorkOrders.length}
                </Badge>
                <h3 className="font-semibold text-sm text-foreground text-center">
                  {column.label}
                </h3>
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
                          isDragDisabled={selectionMode}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`${
                                snapshot.isDragging ? 'opacity-50' : ''
                              } ${
                                selectedWorkOrderIds.includes(workOrder.id) ? 'ring-2 ring-primary' : ''
                              }`}
                            >
                              {selectionMode && (
                                <div className="absolute top-2 left-2 z-10">
                                  <Checkbox
                                    checked={selectedWorkOrderIds.includes(workOrder.id)}
                                    onCheckedChange={(checked) => 
                                      handleSelectWorkOrder(workOrder.id, checked as boolean)
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              )}
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