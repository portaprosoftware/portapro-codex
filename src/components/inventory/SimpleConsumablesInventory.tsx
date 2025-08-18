import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, MoreVertical, Search, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SimpleAddConsumableModal } from './SimpleAddConsumableModal';
import { SimpleEditConsumableModal } from './SimpleEditConsumableModal';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCategoryDisplay } from '@/lib/categoryUtils';
import { CategorySelect } from '@/components/ui/category-select';
import { ConsumableCategoryManager } from './ConsumableCategoryManager';

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
  base_unit: string;
  supplier_info: any;
  location_stock: LocationStockItem[];
  created_at: string;
  updated_at: string;
}

interface LocationStockItem {
  locationId: string;
  locationName: string;
  quantity: number;
  lowStockThreshold?: number;
}

export const SimpleConsumablesInventory: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
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

  // Fetch velocity stats (ADU 7/30/90 and Days of Supply)
  const { data: velocityStats } = useQuery({
    queryKey: ['consumable-velocity-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumable_velocity_stats')
        .select('*');
      if (error) throw error;
      return data as any[];
    }
  });

  // Map for quick lookup by consumable_id
  const velocityById = useMemo(() => {
    const map = new Map<string, any>();
    (velocityStats || []).forEach((row: any) => {
      map.set(row.consumable_id, row);
    });
    return map;
  }, [velocityStats]);

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

  const handleDeleteClick = (consumable: Consumable) => {
    setSelectedConsumable(consumable);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedConsumable) {
      deleteConsumableMutation.mutate(selectedConsumable.id);
      setShowDeleteDialog(false);
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteDialog(false);
    setSelectedConsumable(null);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1 text-gray-600" />
      : <ArrowDown className="w-4 h-4 ml-1 text-gray-600" />;
  };

  // Simple number formatter
  const fmt = (n: any, d = 1) => (n === null || n === undefined ? '-' : Number(n).toFixed(d));

  // Derive filtered and sorted list
  const filteredConsumables = useMemo(() => {
    if (!consumables) return [];
    
    let filtered = consumables;
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(search) ||
        c.description?.toLowerCase().includes(search) ||
        c.sku?.toLowerCase().includes(search) ||
        formatCategoryDisplay(c.category).toLowerCase().includes(search) ||
        c.notes?.toLowerCase().includes(search)
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = formatCategoryDisplay(a.category).toLowerCase();
          bValue = formatCategoryDisplay(b.category).toLowerCase();
          break;
        case 'sku':
          aValue = a.sku?.toLowerCase() || '';
          bValue = b.sku?.toLowerCase() || '';
          break;
        case 'unit_cost':
          aValue = a.unit_cost;
          bValue = b.unit_cost;
          break;
        case 'unit_price':
          aValue = a.unit_price;
          bValue = b.unit_price;
          break;
        case 'on_hand_qty':
          aValue = a.on_hand_qty;
          bValue = b.on_hand_qty;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        const comparison = aValue - bValue;
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });
    
    return sorted;
  }, [consumables, categoryFilter, searchTerm, sortField, sortDirection]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none px-4 md:px-6 py-6 space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 font-inter">Consumables Management</h1>
              <p className="text-base text-gray-600 font-inter mt-1">Manage your consumable inventory with simplified location tracking</p>
            </div>
            <div className="flex items-center gap-2">
              <ConsumableCategoryManager />
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold border-0 shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Consumable
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, SKU, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Category</label>
              <div className="flex items-center gap-2">
                <div className="w-full">
                  <CategorySelect
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                    placeholder="All categories"
                  />
                </div>
                {categoryFilter && (
                  <Button variant="outline" size="sm" onClick={() => setCategoryFilter('')}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
            {(searchTerm.trim() || categoryFilter) && (
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('');
                  }}
                  className="mb-0"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
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
            ) : !filteredConsumables || filteredConsumables.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">
                  {categoryFilter ? 'No consumables match this category.' : 'No consumables found. Add your first consumable to get started.'}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-gray-50"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          Name
                          {getSortIcon('name')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-gray-50 hidden md:table-cell"
                        onClick={() => handleSort('category')}
                      >
                        <div className="flex items-center">
                          Category
                          {getSortIcon('category')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-gray-50 hidden lg:table-cell"
                        onClick={() => handleSort('sku')}
                      >
                        <div className="flex items-center">
                          SKU
                          {getSortIcon('sku')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-gray-50 hidden lg:table-cell"
                        onClick={() => handleSort('unit_cost')}
                      >
                        <div className="flex items-center">
                          Cost per {consumables?.[0]?.base_unit || 'case'}
                          {getSortIcon('unit_cost')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-gray-50 hidden lg:table-cell"
                        onClick={() => handleSort('unit_price')}
                      >
                        <div className="flex items-center">
                          Price per {consumables?.[0]?.base_unit || 'case'}
                          {getSortIcon('unit_price')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-gray-50"
                        onClick={() => handleSort('on_hand_qty')}
                      >
                        <div className="flex items-center">
                          On Hand
                          {getSortIcon('on_hand_qty')}
                        </div>
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">ADU 7</TableHead>
                      <TableHead className="hidden xl:table-cell">ADU 30</TableHead>
                      <TableHead className="hidden xl:table-cell">ADU 90</TableHead>
                      <TableHead className="hidden lg:table-cell">Est. Services</TableHead>
                      <TableHead className="hidden md:table-cell">Locations</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsumables.map((consumable) => {
                    // Calculate estimated services remaining
                    const assumedUsePerService = consumable.supplier_info?.assumed_use_per_service;
                    const estimatedServices = assumedUsePerService && assumedUsePerService > 0 
                      ? Math.floor(consumable.on_hand_qty / assumedUsePerService)
                      : null;
                    
                     return (
                       <TableRow key={consumable.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{consumable.name}</div>
                          <div className="text-sm text-gray-500 md:hidden">
                            {formatCategoryDisplay(consumable.category)} • {consumable.on_hand_qty} {consumable.base_unit || 'units'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{formatCategoryDisplay(consumable.category)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{consumable.sku || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">${consumable.unit_cost.toFixed(2)}</TableCell>
                      <TableCell className="hidden lg:table-cell">${consumable.unit_price.toFixed(2)}</TableCell>
                      <TableCell className="hidden md:table-cell">{consumable.on_hand_qty} {consumable.base_unit || 'units'}</TableCell>
                      <TableCell className="hidden xl:table-cell">{fmt(velocityById.get(consumable.id)?.adu_7)}</TableCell>
                      <TableCell className="hidden xl:table-cell">{fmt(velocityById.get(consumable.id)?.adu_30)}</TableCell>
                      <TableCell className="hidden xl:table-cell">{fmt(velocityById.get(consumable.id)?.adu_90)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{estimatedServices ? `${estimatedServices}` : '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {consumable.location_stock?.length > 0 ? (
                          <div className="space-y-1">
                             {consumable.location_stock.slice(0, 2).map((loc, index) => {
                               const isLowStock = loc.lowStockThreshold && loc.quantity <= loc.lowStockThreshold;
                               return (
                                 <div key={index} className={`flex items-center justify-between bg-gray-50 rounded px-2 py-1 text-xs ${isLowStock ? 'border border-orange-200 bg-orange-50' : ''}`}>
                                   <span className="text-gray-700 truncate max-w-[100px]">{loc.locationName}</span>
                                   <div className="flex items-center gap-1">
                                     <span className="font-medium">{loc.quantity}</span>
                                     {isLowStock && <AlertTriangle className="w-3 h-3 text-orange-500" />}
                                   </div>
                                 </div>
                               );
                             })}
                             {consumable.location_stock.length > 2 && (
                               <div className="text-xs text-gray-500 px-2">
                                 +{consumable.location_stock.length - 2} more
                               </div>
                             )}
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <span className="text-gray-400 text-xs">No locations</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="w-16">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white z-50">
                            <DropdownMenuItem
                              onClick={() => handleEdit(consumable)}
                              className="cursor-pointer"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(consumable)}
                              disabled={deleteConsumableMutation.isPending}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                       </TableRow>
                     );
                   })}
                 </TableBody>
              </Table>
              </div>
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

        <DeleteConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Consumable"
          itemName={selectedConsumable?.name}
          isLoading={deleteConsumableMutation.isPending}
        />
      </div>
    </div>
  );
};
