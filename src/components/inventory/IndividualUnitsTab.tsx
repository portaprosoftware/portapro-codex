import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Scan, Plus, MoreHorizontal, Copy, ArrowDown, ArrowUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditItemModal } from './EditItemModal';
import { generateRandomString } from '@/lib/utils';
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal';

interface IndividualUnitsTabProps {
  productId: string;
}

interface ProductItem {
  id: string;
  product_id: string;
  barcode: string;
  status: string;
  condition: string;
  location: string;
  current_storage_location_id: string | null;
  color: string;
  size: string;
  material: string;
  notes: string;
  maintenance_reason: string;
  expected_return_date: string | null;
  maintenance_notes: string;
  tool_number: string;
  vendor_id: string | null;
  plastic_code: string;
  manufacturing_date: string | null;
  mold_cavity: string;
}

interface FilterOptions {
  status: string;
  condition: string;
  storageLocation: string;
}

interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

export const IndividualUnitsTab: React.FC<IndividualUnitsTabProps> = ({ productId }) => {
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: 'all',
    condition: 'all',
    storageLocation: 'all',
  });
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: 'barcode',
    order: 'asc',
  });
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: productItems, isLoading, refetch } = useQuery({
    queryKey: ['product-items', productId, searchQuery, filterOptions, sortOptions],
    queryFn: async () => {
      let query = supabase
        .from('product_items')
        .select('*')
        .eq('product_id', productId);

      if (searchQuery) {
        query = query.ilike('barcode', `%${searchQuery}%`);
      }

      if (filterOptions.status !== 'all') {
        query = query.eq('status', filterOptions.status);
      }
      if (filterOptions.condition !== 'all') {
        query = query.eq('condition', filterOptions.condition);
      }
      if (filterOptions.storageLocation !== 'all') {
        query = query.eq('current_storage_location_id', filterOptions.storageLocation);
      }

      query = query.order(sortOptions.field, { ascending: sortOptions.order === 'asc' });

      const { data, error } = await query;
      if (error) throw error;
      return data as ProductItem[];
    },
  });

  const { data: storageLocations } = useQuery({
    queryKey: ['storage-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const newBarcode = generateRandomString(8);
      const { data, error } = await supabase
        .from('product_items')
        .insert({ product_id: productId, barcode: newBarcode })
        .select()
        .single();

      if (error) throw error;
      return data as ProductItem;
    },
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ['product-items', productId] });
      toast.success(`Unit ${newItem.barcode} created`);
    },
    onError: (error) => {
      console.error('Create error details:', error);
      toast.error('Failed to create unit');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const { error } = await supabase
        .from('product_items')
        .delete()
        .in('id', itemIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-items', productId] });
      toast.success('Units deleted successfully');
      setSelectedUnits(new Set());
    },
    onError: (error) => {
      console.error('Delete error details:', error);
      toast.error('Failed to delete units');
    },
    onSettled: () => {
      setIsDeleteModalOpen(false);
    },
  });

  const handleEditUnit = (unitId: string) => {
    setSelectedUnit(unitId);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedUnit(null);
    setIsEditModalOpen(false);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilterOptions(prev => ({ ...prev, [field]: value }));
  };

  const handleSortChange = (field: string) => {
    setSortOptions(prev => ({
      field: field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allUnitIds = productItems?.map(item => item.id) || [];
      setSelectedUnits(new Set(allUnitIds));
    } else {
      setSelectedUnits(new Set());
    }
  };

  const handleSelectUnit = (unitId: string, checked: boolean) => {
    const newSelectedUnits = new Set(selectedUnits);
    if (checked) {
      newSelectedUnits.add(unitId);
    } else {
      newSelectedUnits.delete(unitId);
    }
    setSelectedUnits(newSelectedUnits);
  };

  const handleDeleteSelected = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedUnits.size > 0) {
      await deleteMutation.mutateAsync(Array.from(selectedUnits));
    }
  };

  const isAllSelected = productItems && selectedUnits.size === productItems.length;
  const hasSelection = selectedUnits.size > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          type="search"
          placeholder="Search by barcode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Add Unit
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select
                id="status-filter"
                value={filterOptions.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="condition-filter">Condition</Label>
              <Select
                id="condition-filter"
                value={filterOptions.condition}
                onValueChange={(value) => handleFilterChange('condition', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Conditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="needs_repair">Needs Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="storage-location-filter">Storage Location</Label>
              <Select
                id="storage-location-filter"
                value={filterOptions.storageLocation}
                onValueChange={(value) => handleFilterChange('storageLocation', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {storageLocations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasSelection && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {selectedUnits.size} unit(s) selected
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={deleteMutation.isLoading}
          >
            Delete Selected
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected && productItems?.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSortChange('barcode')}>
                  Barcode
                  {sortOptions.field === 'barcode' && (
                    sortOptions.order === 'asc' ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUp className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSortChange('status')}>
                  Status
                  {sortOptions.field === 'status' && (
                    sortOptions.order === 'asc' ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUp className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSortChange('condition')}>
                  Condition
                  {sortOptions.field === 'condition' && (
                    sortOptions.order === 'asc' ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUp className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">Loading...</TableCell>
              </TableRow>
            ) : productItems?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">No units found.</TableCell>
              </TableRow>
            ) : (
              productItems?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="w-[50px]">
                    <Checkbox
                      checked={selectedUnits.has(item.id)}
                      onCheckedChange={(checked) => handleSelectUnit(item.id, checked)}
                      aria-label={`Select unit ${item.barcode}`}
                    />
                  </TableCell>
                  <TableCell>{item.barcode}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>{item.condition}</TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUnit(item.id)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Scan className="mr-2 h-4 w-4" /> Scan
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" /> Copy
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {selectedUnit && (
        <EditItemModal
          itemId={selectedUnit}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
        />
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isLoading}
        itemType="units"
      />
    </div>
  );
};
