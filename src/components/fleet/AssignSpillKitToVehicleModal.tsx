import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AssignSpillKitToVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  licensePlate: string;
}

type InventoryItem = {
  id: string;
  item_name: string;
  item_type: string;
  current_stock: number;
  minimum_threshold: number;
  expiration_date?: string;
  is_critical: boolean;
};

type SelectedItem = {
  inventory_item_id: string;
  item_name: string;
  quantity_required: number;
};

export function AssignSpillKitToVehicleModal({ 
  isOpen, 
  onClose, 
  vehicleId,
  licensePlate 
}: AssignSpillKitToVehicleModalProps) {
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());

  // Fetch inventory items
  const { data: inventoryItems, isLoading } = useQuery({
    queryKey: ['spill-kit-inventory-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spill_kit_inventory')
        .select('id, item_name, item_type, current_stock, minimum_threshold, expiration_date, is_critical')
        .order('item_type')
        .order('item_name');
      
      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: isOpen,
  });

  // Assign spill kit mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      const itemsArray = Array.from(selectedItems.values()).map(item => ({
        inventory_item_id: item.inventory_item_id,
        item_name: item.item_name,
        quantity_required: item.quantity_required,
        assigned_at: new Date().toISOString(),
      }));

      // Check if vehicle already has a spill kit
      const { data: existing } = await supabase
        .from('vehicle_spill_kits')
        .select('id')
        .eq('vehicle_id', vehicleId)
        .eq('active', true)
        .maybeSingle();

      if (existing) {
        // Update existing kit
        const { error } = await supabase
          .from('vehicle_spill_kits')
          .update({ 
            required_contents: itemsArray,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Create new kit
        const { error } = await supabase
          .from('vehicle_spill_kits')
          .insert({
            vehicle_id: vehicleId,
            required_contents: itemsArray,
            active: true,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-spill-kit', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Spill kit assigned successfully');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to assign spill kit: ${error.message}`);
    },
  });

  const handleToggleItem = (item: InventoryItem, checked: boolean) => {
    const newSelected = new Map(selectedItems);
    
    if (checked) {
      newSelected.set(item.id, {
        inventory_item_id: item.id,
        item_name: item.item_name,
        quantity_required: 1,
      });
    } else {
      newSelected.delete(item.id);
    }
    
    setSelectedItems(newSelected);
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const newSelected = new Map(selectedItems);
    const item = newSelected.get(itemId);
    
    if (item && quantity > 0) {
      item.quantity_required = quantity;
      newSelected.set(itemId, item);
      setSelectedItems(newSelected);
    }
  };

  const handleClose = () => {
    setSelectedItems(new Map());
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.size === 0) {
      toast.error('Please select at least one item');
      return;
    }
    
    assignMutation.mutate();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'absorbent': 'Absorbents',
      'containment': 'Containment',
      'ppe': 'PPE',
      'decon': 'Decon',
      'tools': 'Tools',
      'disposal': 'Disposal',
      'documentation': 'Documentation',
      'pump_transfer': 'Pump/Transfer',
      'signage': 'Signage',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  const getStockWarning = (item: InventoryItem, requestedQty: number) => {
    if (item.current_stock === 0) {
      return <Badge variant="destructive" className="ml-2">Out of Stock</Badge>;
    }
    if (item.current_stock < requestedQty) {
      return <Badge className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold">Insufficient Stock</Badge>;
    }
    if (item.current_stock <= item.minimum_threshold) {
      return <Badge className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold">Low Stock</Badge>;
    }
    return null;
  };

  // Group items by type
  const groupedItems = inventoryItems?.reduce((acc, item) => {
    if (!acc[item.item_type]) {
      acc[item.item_type] = [];
    }
    acc[item.item_type].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>
            Assign Spill Kit to {licensePlate}
          </DialogTitle>
          <DialogDescription>
            Select inventory items to include in this vehicle's spill kit. You can specify the required quantity for each item.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[500px] pr-4">
            {isLoading && <div className="text-center py-8">Loading inventory...</div>}
            
            {!isLoading && groupedItems && Object.entries(groupedItems).map(([type, items]) => (
              <div key={type} className="mb-6">
                <h3 className="text-sm font-semibold mb-3 px-2 py-1 bg-muted rounded">
                  {getTypeLabel(type)}
                </h3>
                <div className="space-y-3">
                  {items.map((item) => {
                    const isSelected = selectedItems.has(item.id);
                    const selectedItem = selectedItems.get(item.id);
                    
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={`item-${item.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleToggleItem(item, checked as boolean)}
                        />
                        
                        <div className="flex-1">
                          <Label
                            htmlFor={`item-${item.id}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <span className="font-medium">{item.item_name}</span>
                            {item.is_critical && (
                              <Badge className="bg-gradient-to-r from-red-500 to-red-700 text-white font-bold text-xs">
                                Critical
                              </Badge>
                            )}
                            {selectedItem && getStockWarning(item, selectedItem.quantity_required)}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Stock: {item.current_stock} available
                          </p>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`qty-${item.id}`} className="text-sm">Qty:</Label>
                            <Input
                              id={`qty-${item.id}`}
                              type="number"
                              min="1"
                              value={selectedItem?.quantity_required || 1}
                              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {selectedItems.size > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">
                      {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-sm text-blue-700">
                      Total quantity: {Array.from(selectedItems.values()).reduce((sum, item) => sum + item.quantity_required, 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} className="min-w-[100px]">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={selectedItems.size === 0 || assignMutation.isPending}
              className="min-w-[140px]"
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign Spill Kit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
