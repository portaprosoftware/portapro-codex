import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { SpillKitTypeSelectionModal } from './SpillKitTypeSelectionModal';

type SpillKitInventoryItem = {
  id: string;
  item_name: string;
  item_type: string;
  unit_cost: number;
  current_stock: number;
  minimum_threshold: number;
  reorder_quantity: number;
  supplier_name?: string;
  supplier_contact?: string;
  supplier_sku?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export function SpillKitInventoryManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SpillKitInventoryItem | null>(null);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '',
    item_type: '',
    unit_cost: '',
    current_stock: '',
    minimum_threshold: '',
    reorder_quantity: '',
    supplier_name: '',
    supplier_contact: '',
    supplier_sku: '',
    notes: '',
  });

  // Fetch inventory items
  const { data: inventoryItems, isLoading } = useQuery({
    queryKey: ['spill-kit-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spill_kit_inventory')
        .select('*')
        .order('item_name');
      
      if (error) throw error;
      return data as SpillKitInventoryItem[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        item_name: data.item_name,
        item_type: data.item_type,
        unit_cost: parseFloat(data.unit_cost),
        current_stock: parseInt(data.current_stock),
        minimum_threshold: parseInt(data.minimum_threshold),
        reorder_quantity: parseInt(data.reorder_quantity),
        supplier_name: data.supplier_name || null,
        supplier_contact: data.supplier_contact || null,
        supplier_sku: data.supplier_sku || null,
        notes: data.notes || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('spill_kit_inventory')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('spill_kit_inventory')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spill-kit-inventory'] });
      toast.success(editingItem ? 'Item updated successfully' : 'Item added successfully');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(`Failed to save item: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('spill_kit_inventory')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spill-kit-inventory'] });
      toast.success('Item deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });

  const handleOpenDialog = (item?: SpillKitInventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        item_name: item.item_name,
        item_type: item.item_type,
        unit_cost: item.unit_cost.toString(),
        current_stock: item.current_stock.toString(),
        minimum_threshold: item.minimum_threshold.toString(),
        reorder_quantity: item.reorder_quantity.toString(),
        supplier_name: item.supplier_name || '',
        supplier_contact: item.supplier_contact || '',
        supplier_sku: item.supplier_sku || '',
        notes: item.notes || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        item_name: '',
        item_type: '',
        unit_cost: '',
        current_stock: '',
        minimum_threshold: '',
        reorder_quantity: '',
        supplier_name: '',
        supplier_contact: '',
        supplier_sku: '',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this inventory item?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSelectType = (type: string) => {
    setFormData({ ...formData, item_type: type });
    setTypeModalOpen(false);
  };

  const getTypeLabel = (type: string) => {
    if (!type) return 'Select Category Type';
    const labels: Record<string, string> = {
      'absorbent': 'Absorbents',
      'containment': 'Containment & Control',
      'ppe': 'PPE',
      'decon': 'Decon & Cleaning',
      'tools': 'Tools & Hardware',
      'disposal': 'Disposal & Packaging',
      'documentation': 'Documentation & Labels',
      'pump_transfer': 'Pump / Transfer',
      'signage': 'Signage & Safety',
      'other': 'General / Other'
    };
    return labels[type] || type;
  };

  const getLowStockCount = () => {
    return inventoryItems?.filter(item => item.current_stock <= item.minimum_threshold).length || 0;
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Item Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Spill Kit Inventory</h2>
          <p className="text-muted-foreground">
            Manage stock levels, costs, and supplier information for spill kit components
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          variant="outline"
          className="h-10 bg-gray-50 hover:bg-gray-100 border-gray-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryItems?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{getLowStockCount()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${inventoryItems?.reduce((sum, item) => sum + (item.unit_cost * item.current_stock), 0).toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Main Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Min Threshold</TableHead>
                <TableHead>Reorder Qty</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.item_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.item_type}
                    </Badge>
                  </TableCell>
                  <TableCell>${item.unit_cost.toFixed(2)}</TableCell>
                  <TableCell>
                    {item.current_stock <= item.minimum_threshold ? (
                      <Badge variant="destructive">{item.current_stock}</Badge>
                    ) : (
                      <span>{item.current_stock}</span>
                    )}
                  </TableCell>
                  <TableCell>{item.minimum_threshold}</TableCell>
                  <TableCell>{item.reorder_quantity}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.supplier_name || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!inventoryItems || inventoryItems.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No inventory items found. Add your first item to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit' : 'Add'} Inventory Item</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update' : 'Add'} spill kit component information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item_name">Item Name *</Label>
                  <Input
                    id="item_name"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item_type">Type *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTypeModalOpen(true)}
                    className={`w-full justify-start text-left font-normal h-12 ${!formData.item_type ? 'text-muted-foreground' : ''}`}
                  >
                    {getTypeLabel(formData.item_type)}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_cost">Unit Cost ($) *</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_stock">Current Stock *</Label>
                  <Input
                    id="current_stock"
                    type="number"
                    min="0"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimum_threshold">Minimum Threshold *</Label>
                  <Input
                    id="minimum_threshold"
                    type="number"
                    min="0"
                    value={formData.minimum_threshold}
                    onChange={(e) => setFormData({ ...formData, minimum_threshold: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorder_quantity">Reorder Quantity *</Label>
                  <Input
                    id="reorder_quantity"
                    type="number"
                    min="1"
                    value={formData.reorder_quantity}
                    onChange={(e) => setFormData({ ...formData, reorder_quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_name">Supplier Name</Label>
                <Input
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier_contact">Supplier Contact</Label>
                  <Input
                    id="supplier_contact"
                    value={formData.supplier_contact}
                    onChange={(e) => setFormData({ ...formData, supplier_contact: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_sku">Supplier SKU</Label>
                  <Input
                    id="supplier_sku"
                    value={formData.supplier_sku}
                    onChange={(e) => setFormData({ ...formData, supplier_sku: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Spill Kit Type Selection Modal */}
      <SpillKitTypeSelectionModal
        isOpen={typeModalOpen}
        onClose={() => setTypeModalOpen(false)}
        onSelect={handleSelectType}
        currentValue={formData.item_type}
      />
    </div>
  );
}
