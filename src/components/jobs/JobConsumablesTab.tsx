import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUserRole } from '@/hooks/useUserRole';
import { Plus, Trash2, Package, DollarSign, Calculator } from 'lucide-react';
import { toast } from 'sonner';

interface JobConsumablesTabProps {
  jobId: string;
}

interface JobConsumable {
  id: string;
  consumable_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  used_at: string;
  used_by?: string;
  notes?: string;
  consumables: {
    name: string;
    category: string;
    unit_cost: number;
    on_hand_qty: number;
  };
}

export const JobConsumablesTab: React.FC<JobConsumablesTabProps> = ({ jobId }) => {
  const { hasStaffAccess, user } = useUserRole();
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  const [newConsumableData, setNewConsumableData] = useState({
    consumable_id: '',
    quantity: 1,
    unit_price: 0,
    notes: ''
  });

  // Fetch job consumables
  const { data: jobConsumables, isLoading } = useQuery({
    queryKey: ['job-consumables', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_consumables')
        .select(`
          *,
          consumables!inner(name, category, unit_cost, on_hand_qty)
        `)
        .eq('job_id', jobId)
        .order('used_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as JobConsumable[];
    }
  });

  // Fetch available consumables
  const { data: availableConsumables } = useQuery({
    queryKey: ['available-consumables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables')
        .select('*')
        .eq('is_active', true)
        .gt('on_hand_qty', 0)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: showAddModal
  });

  // Add consumable to job
  const addConsumableMutation = useMutation({
    mutationFn: async () => {
      const selectedConsumable = availableConsumables?.find(c => c.id === newConsumableData.consumable_id);
      if (!selectedConsumable) throw new Error('Consumable not found');

      if (newConsumableData.quantity > selectedConsumable.on_hand_qty) {
        throw new Error(`Only ${selectedConsumable.on_hand_qty} units available`);
      }

      const unitPrice = newConsumableData.unit_price || selectedConsumable.unit_price || selectedConsumable.unit_cost * 1.5;
      const lineTotal = newConsumableData.quantity * unitPrice;

      // Add to job_consumables
      const { error: insertError } = await supabase
        .from('job_consumables')
        .insert([{
          job_id: jobId,
          consumable_id: newConsumableData.consumable_id,
          quantity: newConsumableData.quantity,
          unit_price: unitPrice,
          line_total: lineTotal,
          used_by: user?.id,
          notes: newConsumableData.notes
        }]);

      if (insertError) throw insertError;

      // Update consumable stock
      const { error: updateError } = await supabase
        .from('consumables')
        .update({ 
          on_hand_qty: selectedConsumable.on_hand_qty - newConsumableData.quantity 
        })
        .eq('id', newConsumableData.consumable_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-consumables', jobId] });
      queryClient.invalidateQueries({ queryKey: ['available-consumables'] });
      queryClient.invalidateQueries({ queryKey: ['consumables'] });
      toast.success('Consumable added to job');
      setShowAddModal(false);
      setNewConsumableData({
        consumable_id: '',
        quantity: 1,
        unit_price: 0,
        notes: ''
      });
    },
    onError: (error) => {
      toast.error('Failed to add consumable: ' + error.message);
    }
  });

  // Remove consumable from job
  const removeConsumableMutation = useMutation({
    mutationFn: async (consumableRecord: JobConsumable) => {
      // Remove from job_consumables
      const { error: deleteError } = await supabase
        .from('job_consumables')
        .delete()
        .eq('id', consumableRecord.id);

      if (deleteError) throw deleteError;

      // Restore stock
      const { error: updateError } = await supabase
        .from('consumables')
        .update({ 
          on_hand_qty: consumableRecord.consumables.on_hand_qty + consumableRecord.quantity 
        })
        .eq('id', consumableRecord.consumable_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-consumables', jobId] });
      queryClient.invalidateQueries({ queryKey: ['consumables'] });
      toast.success('Consumable removed from job');
    },
    onError: (error) => {
      toast.error('Failed to remove consumable: ' + error.message);
    }
  });

  const handleConsumableSelect = (consumableId: string) => {
    const selected = availableConsumables?.find(c => c.id === consumableId);
    if (selected) {
      setNewConsumableData(prev => ({
        ...prev,
        consumable_id: consumableId,
        unit_price: selected.unit_price || selected.unit_cost * 1.5
      }));
    }
  };

  const totalValue = jobConsumables?.reduce((sum, item) => sum + item.line_total, 0) || 0;
  const totalQuantity = jobConsumables?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Moving-average materials cost for this job
  const { data: materialsCostData } = useQuery({
    queryKey: ['job-materials-cost', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_materials_cost' as any)
        .select('total_material_cost')
        .eq('job_id', jobId)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as { total_material_cost: number } | null);
    }
  });
  const materialsCost = materialsCostData?.total_material_cost || 0;


  if (!hasStaffAccess) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You don't have permission to view consumables</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{jobConsumables?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Items Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calculator className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{totalQuantity}</p>
                <p className="text-sm text-muted-foreground">Total Quantity</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">${materialsCost.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Materials Cost (MAUC)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consumables Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Consumables Used</CardTitle>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Consumable
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Consumable to Job</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="consumable">Consumable Item *</Label>
                    <Select 
                      value={newConsumableData.consumable_id} 
                      onValueChange={handleConsumableSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select consumable" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableConsumables?.map((consumable) => (
                          <SelectItem key={consumable.id} value={consumable.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{consumable.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {consumable.on_hand_qty} available
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={newConsumableData.quantity}
                        onChange={(e) => 
                          setNewConsumableData(prev => ({ 
                            ...prev, 
                            quantity: parseInt(e.target.value) || 1 
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit_price">Unit Price</Label>
                      <Input
                        id="unit_price"
                        type="number"
                        step="0.01"
                        value={newConsumableData.unit_price}
                        onChange={(e) => 
                          setNewConsumableData(prev => ({ 
                            ...prev, 
                            unit_price: parseFloat(e.target.value) || 0 
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={newConsumableData.notes}
                      onChange={(e) => 
                        setNewConsumableData(prev => ({ ...prev, notes: e.target.value }))
                      }
                      placeholder="Optional notes..."
                    />
                  </div>

                  {newConsumableData.consumable_id && newConsumableData.quantity > 0 && (
                    <div className="p-3 bg-muted rounded">
                      <p className="font-medium">Total: ${(newConsumableData.quantity * newConsumableData.unit_price).toFixed(2)}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => addConsumableMutation.mutate()}
                      disabled={!newConsumableData.consumable_id || addConsumableMutation.isPending}
                      className="flex-1"
                    >
                      {addConsumableMutation.isPending ? 'Adding...' : 'Add to Job'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading consumables...</p>
            </div>
          ) : jobConsumables?.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No consumables used on this job yet</p>
              <p className="text-sm text-muted-foreground">Add consumables to track usage and costs</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Used Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobConsumables?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.consumables.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.consumables.category}</Badge>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">${item.line_total.toFixed(2)}</TableCell>
                    <TableCell>
                      {new Date(item.used_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="max-w-32 truncate">{item.notes || '-'}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Consumable</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove "{item.consumables.name}" from this job? 
                              This will restore {item.quantity} units to inventory.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeConsumableMutation.mutate(item)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};