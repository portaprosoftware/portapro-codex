import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, User, Save, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DriverOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: any[];
  onSaveOrder: (orderedDrivers: any[]) => void;
}

export const DriverOrderModal: React.FC<DriverOrderModalProps> = ({
  isOpen,
  onClose,
  drivers,
  onSaveOrder
}) => {
  const [orderedDrivers, setOrderedDrivers] = useState(drivers);
  const portalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOrderedDrivers(drivers);
  }, [drivers]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(orderedDrivers);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedDrivers(items);
  };

  const handleSave = () => {
    onSaveOrder(orderedDrivers);
    onClose();
  };

  const handleCancel = () => {
    setOrderedDrivers(drivers); // Reset to original order
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border sm:max-h-[90vh] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Reorder Drivers
          </DialogTitle>
          <DialogDescription>
            Drag and drop to change the order of drivers in the dispatch view.
          </DialogDescription>
        </DialogHeader>

        <div ref={portalRef} className="fixed inset-0 z-[10001] pointer-events-none" />

        <div className="py-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="drivers-reorder" type="DRIVER">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "space-y-2 min-h-[200px] p-2 rounded-lg border-2 border-dashed",
                    snapshot.isDraggingOver ? "border-primary bg-muted/50" : "border-muted"
                  )}
                >
                  {orderedDrivers.map((driver, index) => (
                    <Draggable key={String(driver.id)} draggableId={String(driver.id)} index={index}>
                      {(provided, snapshot) => {
                        const card = (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...(provided.draggableProps.style as React.CSSProperties),
                            }}
                            className={cn(
                              "p-3 transition-all bg-background",
                              snapshot.isDragging && "ring-2 ring-primary shadow-xl transform rotate-2"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {driver.first_name} {driver.last_name}
                                </div>
                                {driver.phone && (
                                  <div className="text-xs text-muted-foreground">
                                    {driver.phone}
                                  </div>
                                )}
                              </div>

                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                            </div>
                          </Card>
                        );
                        return snapshot.isDragging && portalRef.current
                          ? createPortal(card, portalRef.current)
                          : card;
                      }}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};