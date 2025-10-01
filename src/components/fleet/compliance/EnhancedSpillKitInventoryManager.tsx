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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Minus, ChevronRight, ChevronLeft, MoreVertical, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { SpillKitTypeSelectionModal } from './SpillKitTypeSelectionModal';
import { MarkItemUsedModal } from './MarkItemUsedModal';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, X } from 'lucide-react';
import { AddSpillKitStorageLocationModal } from './AddSpillKitStorageLocationModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { StorageLocationAssignmentModal } from './StorageLocationAssignmentModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  supplier_portal_url?: string;
  notes?: string;
  is_critical?: boolean;
  expiration_date?: string;
  lot_batch_number?: string;
  linked_template_ids?: string[];
  usage_count?: number;
  last_usage_date?: string;
  created_at: string;
  updated_at: string;
};

export function EnhancedSpillKitInventoryManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SpillKitInventoryItem | null>(null);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [selectedItemForUsage, setSelectedItemForUsage] = useState<SpillKitInventoryItem | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
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
    supplier_portal_url: '',
    notes: '',
    is_critical: false,
    expiration_date: '',
    lot_batch_number: '',
    storage_location_id: '',
  });

  const [locationAssignments, setLocationAssignments] = useState<Array<{ location_id: string; quantity: number }>>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLocationAssignmentModal, setShowLocationAssignmentModal] = useState(false);

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

  // Fetch storage locations from inventory garages
  const { data: inventoryStorageLocations } = useQuery({
    queryKey: ['inventory_storage_locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch storage locations
  const { data: storageLocations } = useQuery({
    queryKey: ['spill_kit_storage_locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spill_kit_storage_locations')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
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
        supplier_portal_url: data.supplier_portal_url || null,
        notes: data.notes || null,
        is_critical: data.is_critical,
        expiration_date: data.expiration_date || null,
        lot_batch_number: data.lot_batch_number || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('spill_kit_inventory')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;

        // Update location stock for existing items
        if (locationAssignments.length > 0) {
          // Delete existing location stock
          await supabase
            .from('spill_kit_location_stock')
            .delete()
            .eq('inventory_item_id', editingItem.id);

          // Insert new location assignments
          const stockRecords = locationAssignments.map(loc => ({
            inventory_item_id: editingItem.id,
            storage_location_id: loc.location_id,
            quantity: loc.quantity,
          }));

          const { error: stockError } = await supabase
            .from('spill_kit_location_stock')
            .insert(stockRecords);
          if (stockError) throw stockError;
        }
      } else {
        const { data: newItem, error } = await supabase
          .from('spill_kit_inventory')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;

        // Create location stock records for new items
        if (locationAssignments.length > 0 && newItem) {
          const stockRecords = locationAssignments.map(loc => ({
            inventory_item_id: newItem.id,
            storage_location_id: loc.location_id,
            quantity: loc.quantity,
          }));

          const { error: stockError } = await supabase
            .from('spill_kit_location_stock')
            .insert(stockRecords);
          if (stockError) throw stockError;
        }
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

  const handleOpenDialog = async (item?: SpillKitInventoryItem) => {
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
        supplier_portal_url: item.supplier_portal_url || '',
        notes: item.notes || '',
        is_critical: item.is_critical || false,
        expiration_date: item.expiration_date || '',
        lot_batch_number: item.lot_batch_number || '',
        storage_location_id: '', // TODO: Load from item if stored
      });

      // Fetch existing location assignments
      const { data: existingStock } = await supabase
        .from('spill_kit_location_stock')
        .select('storage_location_id, quantity')
        .eq('inventory_item_id', item.id);
      
      if (existingStock) {
        setLocationAssignments(existingStock.map(s => ({
          location_id: s.storage_location_id,
          quantity: s.quantity
        })));
      }
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
        supplier_portal_url: '',
        notes: '',
        is_critical: false,
        expiration_date: '',
        lot_batch_number: '',
        storage_location_id: '',
      });
      setLocationAssignments([]);
    }
    setCurrentStep(1);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setCurrentStep(1);
    setLocationAssignments([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleSelectType = (type: string) => {
    setFormData({ ...formData, item_type: type });
    setTypeModalOpen(false);
  };

  const handleMarkUsed = (item: SpillKitInventoryItem) => {
    setSelectedItemForUsage(item);
    setUsageModalOpen(true);
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

  const getStatusBadge = (item: SpillKitInventoryItem) => {
    // Check expired first
    if (item.expiration_date && new Date(item.expiration_date) < new Date()) {
      return <Badge variant="destructive" className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold border-none">Expired</Badge>;
    }
    
    // Check critical missing
    if (item.is_critical && item.current_stock === 0) {
      return <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-red-700 text-white font-bold border-none animate-pulse">Critical Missing</Badge>;
    }
    
    // Check out of stock
    if (item.current_stock === 0) {
      return <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-none">Out of Stock</Badge>;
    }
    
    // Check low stock
    if (item.current_stock <= item.minimum_threshold) {
      return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold border-none">Low Stock</Badge>;
    }
    
    // In stock
    return <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold border-none">In Stock</Badge>;
  };

  const getExpirationColor = (expirationDate?: string) => {
    if (!expirationDate) return '';
    const expiry = new Date(expirationDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'text-red-600 font-bold';
    if (daysUntilExpiry <= 30) return 'text-orange-500 font-semibold';
    if (daysUntilExpiry <= 60) return 'text-yellow-600';
    return '';
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleAddLocation = (locationId: string) => {
    if (!locationAssignments.find(loc => loc.location_id === locationId)) {
      setLocationAssignments([...locationAssignments, { location_id: locationId, quantity: 0 }]);
    }
  };

  const handleRemoveLocation = (locationId: string) => {
    setLocationAssignments(locationAssignments.filter(loc => loc.location_id !== locationId));
  };

  const handleUpdateLocationQuantity = (locationId: string, quantity: number) => {
    setLocationAssignments(locationAssignments.map(loc => 
      loc.location_id === locationId ? { ...loc, quantity } : loc
    ));
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Item Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Spill Kit Inventory Management</h2>
          <p className="text-muted-foreground">
            Track stock, costs, expiration, and usage for compliance components
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          variant="secondary"
          className="h-10"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Spill Kit Inventory
        </Button>
      </div>

      {/* Main Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {getStatusBadge(item)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.item_name}
                    {item.is_critical && (
                      <Badge className="ml-2 text-xs bg-gradient-to-r from-red-500 to-red-700 text-white font-bold border-none">
                        Critical
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold border-none">
                      {getTypeLabel(item.item_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>${item.unit_cost !== null ? item.unit_cost.toFixed(2) : 'N/A'}</TableCell>
                  <TableCell>
                    <span className={item.current_stock !== null && item.minimum_threshold !== null && item.current_stock <= item.minimum_threshold ? 'font-bold text-destructive' : ''}>
                      {item.current_stock !== null ? item.current_stock : '—'}
                    </span>
                  </TableCell>
                  <TableCell className={getExpirationColor(item.expiration_date)}>
                    {item.expiration_date ? format(new Date(item.expiration_date), 'MMM dd, yyyy') : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.usage_count || 0} times
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleMarkUsed(item)}
                          disabled={item.current_stock === 0}
                        >
                          <Minus className="h-4 w-4 mr-2" />
                          Mark as Used
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDialog(item)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {/* Multi-Step Add/Edit Drawer */}
      <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DrawerContent className="h-[85vh] max-sm:h-[100vh] flex flex-col">
          <DrawerHeader>
            <DrawerTitle>{editingItem ? 'Edit' : 'Add'} Inventory Item - Step {currentStep} of 3</DrawerTitle>
            <p className="text-sm text-muted-foreground">
              {currentStep === 1 && 'Basic information and category'}
              {currentStep === 2 && 'Stock levels and costs'}
              {currentStep === 3 && 'Supplier and tracking details'}
            </p>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-24">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="grid gap-4 py-4">
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
                    <Label htmlFor="storage_location">Storage Garage Location</Label>
                    <Select
                      value={formData.storage_location_id}
                      onValueChange={(value) => setFormData({ ...formData, storage_location_id: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select storage garage" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryStorageLocations?.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                            {location.description && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({location.description})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item_type">Category Type *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setTypeModalOpen(true)}
                      className={`w-full justify-start text-left font-normal h-12 ${!formData.item_type ? 'text-muted-foreground' : ''}`}
                    >
                      {getTypeLabel(formData.item_type)}
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_critical"
                      checked={formData.is_critical}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_critical: checked })}
                    />
                    <Label htmlFor="is_critical" className="font-semibold text-red-600">
                      Mark as Critical Item (triggers urgent alerts when low/out)
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Description / Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Stock & Costs */}
              {currentStep === 2 && (
                <div className="grid gap-4 py-4">
                  {/* Storage Location Assignment Button */}
                  <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Storage Locations</Label>
                        <p className="text-sm text-muted-foreground">
                          Assign quantities to storage garage locations
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowLocationAssignmentModal(true)}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Manage Locations
                        {locationAssignments.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {locationAssignments.length}
                          </Badge>
                        )}
                      </Button>
                    </div>
                    {locationAssignments.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Total assigned: {locationAssignments.reduce((sum, loc) => sum + loc.quantity, 0)} units across {locationAssignments.length} location(s)
                      </p>
                    )}
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
                      <p className="text-xs text-muted-foreground">Alert when stock drops to this level</p>
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
                      <p className="text-xs text-muted-foreground">Suggested quantity to order</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Supplier & Tracking */}
              {currentStep === 3 && (
                <div className="grid gap-4 py-4">
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
                    <Label htmlFor="supplier_portal_url">Supplier Portal URL</Label>
                    <Input
                      id="supplier_portal_url"
                      type="url"
                      placeholder="https://..."
                      value={formData.supplier_portal_url}
                      onChange={(e) => setFormData({ ...formData, supplier_portal_url: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Direct link to ordering system</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lot_batch_number">Lot/Batch Number</Label>
                      <Input
                        id="lot_batch_number"
                        value={formData.lot_batch_number}
                        onChange={(e) => setFormData({ ...formData, lot_batch_number: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiration_date">Expiration Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.expiration_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.expiration_date ? (
                              format(new Date(formData.expiration_date), "MMM dd, yyyy")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.expiration_date ? new Date(formData.expiration_date) : undefined}
                            onSelect={(date) => setFormData({ ...formData, expiration_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )}

            </form>
          </div>
          
          {/* Fixed Footer */}
          <div className="sticky bottom-0 left-0 right-0 bg-background border-t px-6 py-4">
            <div className="flex justify-between">
              <div>
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                {currentStep < 3 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmit} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Saving...' : 'Save Item'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Type Selection Modal */}
      <SpillKitTypeSelectionModal
        isOpen={typeModalOpen}
        onClose={() => setTypeModalOpen(false)}
        onSelect={handleSelectType}
        currentValue={formData.item_type}
        multiSelect={false}
      />

      {/* Usage Tracking Modal */}
      {selectedItemForUsage && (
        <MarkItemUsedModal
          isOpen={usageModalOpen}
          onClose={() => {
            setUsageModalOpen(false);
            setSelectedItemForUsage(null);
          }}
          item={selectedItemForUsage}
        />
      )}

      {/* Add Storage Location Modal */}
      <AddSpillKitStorageLocationModal
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['spill_kit_storage_locations'] });
          toast.success('Storage location added successfully');
        }}
      />

      {/* Storage Location Assignment Modal */}
      <StorageLocationAssignmentModal
        isOpen={showLocationAssignmentModal}
        onClose={() => setShowLocationAssignmentModal(false)}
        storageLocations={storageLocations || []}
        locationAssignments={locationAssignments}
        onUpdateAssignments={setLocationAssignments}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this inventory item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
