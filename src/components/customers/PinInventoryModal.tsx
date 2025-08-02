import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, List } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const [activeTab, setActiveTab] = useState('assign');
  const { toast } = useToast();

  const handleSaveAssignments = async () => {
    if (assignments.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one inventory item to assign.",
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
        title: "Inventory assigned",
        description: `Successfully assigned ${assignments.length} item type(s) to "${pinName}"`
      });

      setAssignments([]);
      setActiveTab('current');
      onInventoryUpdated?.();
    } catch (error) {
      console.error('Error saving inventory assignments:', error);
      toast({
        title: "Error saving assignments",
        description: "Failed to save inventory assignments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setAssignments([]);
    setActiveTab('assign');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Manage Inventory for "{pinName}"
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assign" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Assign New Items
            </TabsTrigger>
            <TabsTrigger value="current" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              Current Assignments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assign" className="flex-1 mt-6">
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
                  {isSaving ? 'Saving...' : `Assign ${assignments.length} Item${assignments.length !== 1 ? 's' : ''}`}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="current" className="flex-1 mt-6">
            <div className="h-full overflow-hidden">
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}