import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SimpleAddConsumableModal } from './SimpleAddConsumableModal';
import { SimpleEditConsumableModal } from './SimpleEditConsumableModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Consumable {
  id: string;
  name: string;
  description?: string;
  category: string;
  sku?: string;
  unit_cost: number;
  unit_price: number;
  on_hand_qty: number;
  reorder_threshold: number;
  is_active: boolean;
  notes?: string;
  location_stock: LocationStockItem[];
  created_at: string;
  updated_at: string;
}

interface LocationStockItem {
  locationId: string;
  locationName: string;
  quantity: number;
}

export const SimpleConsumablesInventory: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null);
  const queryClient = useQueryClient();

  // Fetch consumables
  const { data: consumables, isLoading } = useQuery({
    queryKey: ['simple-consumables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Transform the data to parse location_stock JSON
      return (data || []).map(item => ({
        ...item,
        location_stock: typeof item.location_stock === 'string' 
          ? JSON.parse(item.location_stock) 
          : Array.isArray(item.location_stock) 
            ? item.location_stock 
            : []
      })) as Consumable[];
    }
  });

  // Delete mutation
  const deleteConsumableMutation = useMutation({
    mutationFn: async (consumableId: string) => {
      // First delete related consumable_location_stock records
      const { error: locationStockError } = await supabase
        .from('consumable_location_stock')
        .delete()
        .eq('consumable_id', consumableId);
      
      if (locationStockError) {
        console.warn('Warning: Could not delete location stock records:', locationStockError.message);
        // Don't throw error, continue with deletion
      }

      // Delete related job_consumables records
      const { error: jobConsumablesError } = await supabase
        .from('job_consumables')
        .delete()
        .eq('consumable_id', consumableId);
      
      if (jobConsumablesError) {
        console.warn('Warning: Could not delete job consumables records:', jobConsumablesError.message);
        // Don't throw error, continue with deletion
      }
      
      // Finally delete the consumable itself
      const { error: consumableError } = await supabase
        .from('consumables')
        .delete()
        .eq('id', consumableId);
      
      if (consumableError) {
        throw new Error(`Failed to delete consumable: ${consumableError.message}`);
      }
    },
    onSuccess: () => {
      toast.success('Consumable deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['simple-consumables'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete consumable: ${error.message || 'Unknown error'}`);
    }
  });

  const handleEdit = (consumable: Consumable) => {
    setSelectedConsumable(consumable);
    setShowEditModal(true);
  };

  const handleDelete = (consumable: Consumable) => {
    if (window.confirm(`Are you sure you want to delete "${consumable.name}"? This action cannot be undone.`)) {
      deleteConsumableMutation.mutate(consumable.id);
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedConsumable(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none px-6 py-6 space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 font-inter">Consumables Management</h1>
              <p className="text-base text-gray-600 font-inter mt-1">Manage your consumable inventory with simplified location tracking</p>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Consumable
            </Button>
          </div>
        </div>

        {/* Consumables Table */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">Loading consumables...</div>
              </div>
            ) : !consumables || consumables.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">No consumables found. Add your first consumable to get started.</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>On Hand</TableHead>
                    <TableHead>Locations</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consumables.map((consumable) => (
                    <TableRow key={consumable.id}>
                      <TableCell className="font-medium">{consumable.name}</TableCell>
                      <TableCell>{consumable.category}</TableCell>
                      <TableCell>{consumable.sku || '-'}</TableCell>
                      <TableCell>${consumable.unit_cost.toFixed(2)}</TableCell>
                      <TableCell>${consumable.unit_price.toFixed(2)}</TableCell>
                      <TableCell>{consumable.on_hand_qty}</TableCell>
                      <TableCell>
                        {consumable.location_stock?.length > 0 ? (
                          <div className="text-sm">
                            {consumable.location_stock.map((loc, index) => (
                              <div key={index} className="text-gray-600">
                                {loc.locationName}: {loc.quantity}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">No locations</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={consumable.is_active ? 'success' : 'secondary'}>
                          {consumable.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(consumable)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(consumable)}
                            disabled={deleteConsumableMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Modals */}
        <SimpleAddConsumableModal 
          isOpen={showAddModal}
          onClose={handleModalClose}
        />

        <SimpleEditConsumableModal 
          isOpen={showEditModal}
          consumable={selectedConsumable}
          onClose={handleModalClose}
        />
      </div>
    </div>
  );
};