import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Calculator, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCategoryLabel } from '@/lib/consumableCategories';

interface StockCountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CountItem {
  id: string;
  name: string;
  category: string;
  system_qty: number;
  counted_qty: number;
  variance: number;
  counted: boolean;
}

export const StockCountModal: React.FC<StockCountModalProps> = ({
  isOpen,
  onClose
}) => {
  const [countDate, setCountDate] = useState(new Date().toISOString().split('T')[0]);
  const [countType, setCountType] = useState('full');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');
  const [countItems, setCountItems] = useState<CountItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const { data: consumables, isLoading } = useQuery({
    queryKey: ['consumables-for-count', categoryFilter],
    queryFn: async () => {
    let query = supabase
      .from('consumables' as any)
      .select('*')
      .eq('is_active', true)
      .order('name');

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      
    const { data, error } = await query;
    if (error) throw error;
    
    const items: CountItem[] = (data || []).map((consumable: any) => ({
      id: consumable.id,
      name: consumable.name,
      category: consumable.category,
      system_qty: consumable.on_hand_qty,
      counted_qty: 0,
      variance: 0,
      counted: false
    }));
    
    setCountItems(items);
    return (data || []) as any[];
    },
    enabled: isOpen
  });

  const existingCategories = [...new Set((consumables as any)?.map((c: any) => c.category) || [])];

  const stockCountMutation = useMutation({
    mutationFn: async (countData: any) => {
      const countedItems = countItems.filter(item => item.counted);
      
      if (countedItems.length === 0) {
        throw new Error('Please count at least one item');
      }

      // Process adjustments for items with variances
      const adjustments = countedItems
        .filter(item => item.variance !== 0)
        .map(item => ({
          consumable_id: item.id,
          adjustment_type: 'count_adjustment',
          quantity_change: item.variance,
          previous_quantity: item.system_qty,
          new_quantity: item.counted_qty,
          reason: `Physical count adjustment - ${countType} count`,
          notes: `Count date: ${countDate}. ${notes}`.trim(),
          adjusted_by: null // Will be set by auth context if available
        }));

      // Log all adjustments
      for (const adjustment of adjustments) {
        const { error: logError } = await supabase
          .from('consumable_stock_adjustments' as any)
          .insert(adjustment as any);

        if (logError) {
          console.error('Error logging adjustment:', logError);
          throw logError;
        }

        // Update consumable stock
        const { error: updateError } = await supabase
          .from('consumables' as any)
          .update({ on_hand_qty: adjustment.new_quantity } as any)
          .eq('id', adjustment.consumable_id);

        if (updateError) {
          console.error('Error updating stock:', updateError);
          throw updateError;
        }
      }

      return { countedItems, adjustments };
    },
    onSuccess: (data) => {
      const { countedItems, adjustments } = data;
      toast({
        title: "Success",
        description: `Count completed: ${countedItems.length} items counted, ${adjustments.length} adjustments made`,
      });
      handleReset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process stock count",
        variant: "destructive",
      });
    }
  });

  const handleCountChange = (index: number, countedQty: number) => {
    const updatedItems = [...countItems];
    updatedItems[index] = {
      ...updatedItems[index],
      counted_qty: countedQty,
      variance: countedQty - updatedItems[index].system_qty,
      counted: true
    };
    setCountItems(updatedItems);
  };

  const filteredItems = countItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVarianceBadge = (variance: number) => {
    if (variance === 0) return <Badge variant="secondary">No Change</Badge>;
    if (variance > 0) return <Badge variant="default">+{variance}</Badge>;
    return <Badge variant="destructive">{variance}</Badge>;
  };

  const countedItemsCount = countItems.filter(item => item.counted).length;
  const totalVariance = countItems.reduce((sum, item) => sum + Math.abs(item.variance), 0);
  const itemsWithVariance = countItems.filter(item => item.counted && item.variance !== 0).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await stockCountMutation.mutateAsync({
        count_date: countDate,
        count_type: countType,
        notes
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCountDate(new Date().toISOString().split('T')[0]);
    setCountType('full');
    setCategoryFilter('all');
    setSearchTerm('');
    setNotes('');
    setCountItems([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Physical Stock Count
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Count Configuration */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="countDate">Count Date</Label>
              <Input
                id="countDate"
                type="date"
                value={countDate}
                onChange={(e) => setCountDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="countType">Count Type</Label>
              <Select value={countType} onValueChange={setCountType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Count</SelectItem>
                  <SelectItem value="cycle">Cycle Count</SelectItem>
                  <SelectItem value="spot">Spot Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category Filter</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(existingCategories as string[]).map(category => (
                    <SelectItem key={category} value={category}>
                      {getCategoryLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Items</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or category..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Count Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Count Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{filteredItems.length}</p>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{countedItemsCount}</p>
                  <p className="text-sm text-muted-foreground">Items Counted</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{itemsWithVariance}</p>
                  <p className="text-sm text-muted-foreground">Variances Found</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{totalVariance}</p>
                  <p className="text-sm text-muted-foreground">Total Variance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Count Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Count Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>System Qty</TableHead>
                    <TableHead>Counted Qty</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{getCategoryLabel(item.category)}</TableCell>
                      <TableCell>{item.system_qty}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={item.counted_qty}
                          onChange={(e) => handleCountChange(
                            countItems.findIndex(ci => ci.id === item.id), 
                            parseInt(e.target.value) || 0
                          )}
                          className="w-20"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        {item.counted ? getVarianceBadge(item.variance) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.counted ? (
                            <Badge variant="default">Counted</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                          {item.counted && Math.abs(item.variance) > 10 && (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Count Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any notes about this stock count..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || countedItemsCount === 0}>
              {isSubmitting ? 'Processing...' : 'Complete Count'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};