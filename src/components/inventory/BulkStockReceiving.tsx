import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkReceivingItem {
  consumable_id: string;
  consumable_name: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
}

export const BulkStockReceiving: React.FC = () => {
  const [receivingDate, setReceivingDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivingSource, setReceivingSource] = useState('');
  const [notes, setNotes] = useState('');
  const [receivingItems, setReceivingItems] = useState<BulkReceivingItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const { data: consumables } = useQuery({
    queryKey: ['consumables-for-bulk-receiving'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables' as any)
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return (data || []) as any[];
    }
  });

  const bulkReceiveMutation = useMutation({
    mutationFn: async (receivingData: any) => {
      if (receivingItems.length === 0) {
        throw new Error('Please add at least one item to receive');
      }

      // Process each receiving item
      for (const item of receivingItems) {
        // Log the stock adjustment
        const { error: logError } = await supabase
          .from('consumable_stock_adjustments' as any)
          .insert({
            consumable_id: item.consumable_id,
            adjustment_type: 'received',
            quantity_change: item.quantity,
            previous_quantity: 0, // Will be updated by trigger
            new_quantity: 0, // Will be updated by trigger
            reason: `Bulk receiving from ${receivingSource || 'Unknown source'}`,
            notes: notes,
            adjusted_by: null // Will be set by auth context if available
          });

        if (logError) {
          console.error('Error logging stock adjustment:', logError);
        }

        // Update the consumable stock quantity
        const { error: updateError } = await supabase
          .from('consumables' as any)
          .update({ 
            on_hand_qty: (item.quantity as any)
          } as any)
          .eq('id', item.consumable_id);

        if (updateError) {
          console.error('Error updating consumable:', updateError);
          throw updateError;
        }
      }

      return receivingItems;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Successfully received ${data.length} items`,
      });
      handleReset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process bulk receiving",
        variant: "destructive",
      });
    }
  });

  const handleAddItem = () => {
    setReceivingItems([...receivingItems, {
      consumable_id: '',
      consumable_name: '',
      quantity: 1,
      unit_cost: 0,
      line_total: 0
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setReceivingItems(receivingItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof BulkReceivingItem, value: any) => {
    const updatedItems = [...receivingItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'consumable_id') {
      const consumable = (consumables as any)?.find((c: any) => c.id === value);
      if (consumable) {
        updatedItems[index].consumable_name = consumable.name;
        updatedItems[index].unit_cost = consumable.unit_cost;
      }
    }
    
    if (field === 'quantity' || field === 'unit_cost') {
      updatedItems[index].line_total = updatedItems[index].quantity * updatedItems[index].unit_cost;
    }
    
    setReceivingItems(updatedItems);
  };

  const getTotalValue = () => {
    return receivingItems.reduce((sum, item) => sum + item.line_total, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!receivingSource.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter receiving source",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await bulkReceiveMutation.mutateAsync({
        receiving_date: receivingDate,
        source: receivingSource,
        notes: notes
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setReceivingDate(new Date().toISOString().split('T')[0]);
    setReceivingSource('');
    setNotes('');
    setReceivingItems([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Bulk Stock Receiving
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="space-y-2">
              <Label htmlFor="source">Receiving Source</Label>
              <Input
                id="source"
                value={receivingSource}
                onChange={(e) => setReceivingSource(e.target.value)}
                placeholder="e.g., Direct purchase, Transfer, etc."
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Items to Receive</h3>
              <Button type="button" onClick={handleAddItem} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {receivingItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items added yet. Click "Add Item" to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Consumable</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivingItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={item.consumable_id}
                          onValueChange={(value) => handleItemChange(index, 'consumable_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select consumable" />
                          </SelectTrigger>
                          <SelectContent>
                          {(consumables as any)?.map((consumable: any) => (
                            <SelectItem key={consumable.id} value={consumable.id}>
                              {consumable.name}
                            </SelectItem>
                          ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_cost}
                          onChange={(e) => handleItemChange(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        ${item.line_total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">
                      Total Value:
                    </TableCell>
                    <TableCell className="font-bold">
                      ${getTotalValue().toFixed(2)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional notes about this receiving..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting || receivingItems.length === 0}>
              {isSubmitting ? 'Processing...' : 'Complete Receiving'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};