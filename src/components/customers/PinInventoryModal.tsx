import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, List } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { PinInventorySelector } from './PinInventorySelector';
import { AssignedInventoryList } from './AssignedInventoryList';

interface InventoryAssignment {
  productId: string;
  quantity: number;
}

interface PinInventoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  coordinateId: string;
  pinName: string;
  onInventoryUpdated?: () => void;
}

export function PinInventoryModal({ isOpen, onOpenChange, coordinateId, pinName, onInventoryUpdated }: PinInventoryModalProps) {
  const [assignments, setAssignments] = useState<InventoryAssignment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSaveAssignments = async () => {
    if (assignments.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one inventory item for the template.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Insert new assignments
      const insertData = assignments.map(assignment => ({
        coordinate_id: coordinateId,
        product_id: assignment.productId,
        assigned_quantity: assignment.quantity
      }));

      const { error } = await supabase
        .from('pin_inventory_assignments')
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Template saved",
        description: `Successfully saved ${assignments.length} item type(s) to "${pinName}" template`
      });

      setAssignments([]);
      setActiveTab('current');
      // Force refresh of the inventory list
      await queryClient.invalidateQueries({ queryKey: ['pin-inventory-assignments', coordinateId] });
      onInventoryUpdated?.();
    } catch (error) {
      console.error('Error saving inventory assignments:', error);
      toast({
        title: "Error saving template",
        description: "Failed to save inventory template. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setAssignments([]);
    setActiveTab('current');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Manage Inventory Template for "{pinName}"
          </DialogTitle>
          <div className="bg-muted/50 border border-border rounded-lg p-4 mt-4">
            <p className="text-sm text-foreground">
              <strong>Note:</strong> Assigning inventory here is purely for reference and does not reserve or alter your actual stock levels. 
              When you go to add these items to a new job, you'll have a chance to select and confirm the exact units and dates, ensuring real-time availability. 
              This module simply records the typical types and quantities you usually assign to this pin for repeat events.
            </p>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              Saved Template Inventory Items
            </TabsTrigger>
            <TabsTrigger value="assign" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Add Template Items
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="flex-1 mt-6 flex flex-col">
            <div className="flex-1 overflow-hidden">
              <AssignedInventoryList
                coordinateId={coordinateId}
                onDelete={() => onInventoryUpdated?.()}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="assign" className="flex-1 mt-6 flex flex-col">
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex-1 overflow-hidden">
                <PinInventorySelector
                  onAssignmentsChange={setAssignments}
                  existingAssignments={assignments}
                />
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={handleSaveAssignments}
                  disabled={assignments.length === 0 || isSaving}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : `Save ${assignments.length} Template Item${assignments.length !== 1 ? 's' : ''}`}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}