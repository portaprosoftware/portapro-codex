import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PurchaseOrder {
  id: string;
  vendor_name: string;
  order_date: string;
  total_amount: number;
  status: string;
  notes?: string;
}

interface ReceivePurchaseOrderModalProps {
  isOpen: boolean;
  order: PurchaseOrder | null;
  onClose: () => void;
}

interface ReceivingItem {
  id: string;
  name: string;
  ordered_qty: number;
  received_qty: number;
  unit_cost: number;
  selected: boolean;
}

export const ReceivePurchaseOrderModal: React.FC<ReceivePurchaseOrderModalProps> = ({
  isOpen,
  order,
  onClose
}) => {
  const [receivingDate, setReceivingDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivingNotes, setReceivingNotes] = useState('');
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  // Mock data for demonstration - in real app, fetch from purchase_order_items table
  const { data: consumables } = useQuery({
    queryKey: ['consumables-for-receiving'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables' as any)
        .select('*')
        .eq('is_active', true)
        .limit(5); // Mock some items for demo
      
      if (error) throw error;
      
      // Transform to receiving items format
      const items: ReceivingItem[] = (data || []).map((consumable: any) => ({
        id: consumable.id,
        name: consumable.name,
        ordered_qty: Math.floor(Math.random() * 50) + 10, // Mock ordered quantity
        received_qty: 0,
        unit_cost: consumable.unit_cost,
        selected: false
      }));
      
      setReceivingItems(items);
      return items;
    },
    enabled: isOpen && !!order
  });

  const receiveOrderMutation = useMutation({
    mutationFn: async (receivingData: any) => {
      const selectedItems = receivingItems.filter(item => item.selected && item.received_qty > 0);
      
      if (selectedItems.length === 0) {
        throw new Error('Please select at least one item to receive');
      }

      // Update consumable stock levels (simplified for demo)
      for (const item of selectedItems) {
        // Log the stock change in consumable_stock_adjustments table
        const { error: logError } = await supabase
          .from('consumable_stock_adjustments' as any)
          .insert({
            consumable_id: item.id,
            adjustment_type: 'received',
            quantity_change: item.received_qty,
            previous_quantity: 0,
            new_quantity: item.received_qty,
            reason: `Purchase order ${order?.id} - Stock received`,
            notes: receivingNotes
          } as any);

        if (logError) {
          console.error('Error logging stock change:', logError);
        }

        // Update the consumable stock quantity
        const { error: updateError } = await supabase
          .from('consumables' as any)
          .update({ 
            on_hand_qty: item.received_qty // Simplified update for demo
          } as any)
          .eq('id', item.id);

        if (updateError) {
          console.error('Error updating consumable:', updateError);
        }
      }

      // Update purchase order status
      const allItemsReceived = receivingItems.every(item => 
        !item.selected || item.received_qty >= item.ordered_qty
      );
      
      const newStatus = allItemsReceived ? 'completed' : 'partial';
      
      const { error: poError } = await supabase
        .from('purchase_orders' as any)
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', order!.id);

      if (poError) throw poError;

      return { selectedItems, newStatus };
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Received ${data.selectedItems.length} items successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to receive purchase order",
        variant: "destructive",
      });
    }
  });

  const handleItemChange = (index: number, field: keyof ReceivingItem, value: any) => {
    const updatedItems = [...receivingItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setReceivingItems(updatedItems);
  };

  const handleSelectAll = (checked: boolean) => {
    const updatedItems = receivingItems.map(item => ({ 
      ...item, 
      selected: checked,
      received_qty: checked ? item.ordered_qty : 0
    }));
    setReceivingItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await receiveOrderMutation.mutateAsync({
        receiving_date: receivingDate,
        notes: receivingNotes
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  const selectedCount = receivingItems.filter(item => item.selected).length;
  const totalReceivingValue = receivingItems
    .filter(item => item.selected)
    .reduce((sum, item) => sum + (item.received_qty * item.unit_cost), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive Purchase Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {order.vendor_name}
                </CardTitle>
                <Badge variant="secondary">{order.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    Order Date: {new Date(order.order_date).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-sm">
                  Total: ${order.total_amount.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Receiving Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receivingDate">Receiving Date</Label>
              <Input
                id="receivingDate"
                type="date"
                value={receivingDate}
                onChange={(e) => setReceivingDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Items to Receive */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items to Receive</CardTitle>
              <div className="flex items-center gap-4 text-sm">
                <span>{selectedCount} items selected</span>
                <span>Total Value: ${totalReceivingValue.toFixed(2)}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll(true)}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll(false)}
                >
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Receive</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Ordered</TableHead>
                    <TableHead>Receiving</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivingItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={(checked) => 
                            handleItemChange(index, 'selected', checked)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.ordered_qty}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={item.ordered_qty}
                          value={item.received_qty}
                          onChange={(e) => 
                            handleItemChange(index, 'received_qty', parseInt(e.target.value) || 0)
                          }
                          className="w-20"
                          disabled={!item.selected}
                        />
                      </TableCell>
                      <TableCell>${item.unit_cost.toFixed(2)}</TableCell>
                      <TableCell>
                        ${(item.received_qty * item.unit_cost).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Receiving Notes */}
          <div className="space-y-2">
            <Label htmlFor="receivingNotes">Receiving Notes</Label>
            <Textarea
              id="receivingNotes"
              value={receivingNotes}
              onChange={(e) => setReceivingNotes(e.target.value)}
              placeholder="Enter any notes about the receiving process..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || selectedCount === 0}>
              {isSubmitting ? 'Processing...' : 'Complete Receiving'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};