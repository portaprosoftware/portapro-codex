import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, MoreVertical, Search, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, ChevronRight, ChevronDown, Eye, ScanLine, Info, Package, DollarSign } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { EnhancedAddConsumableModal } from './EnhancedAddConsumableModal';
import { EnhancedEditConsumableModal } from './EnhancedEditConsumableModal';
import { ViewConsumableModal } from './ViewConsumableModal';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCategoryDisplay } from '@/lib/categoryUtils';
import { CategorySelect } from '@/components/ui/category-select';
import { BarcodeScannerModal } from '@/components/ui/barcode-scanner';
import { ConsumableCategoryManager } from './ConsumableCategoryManager';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TabNav } from '@/components/ui/TabNav';
import { SimpleConsumablesAnalytics } from './SimpleConsumablesAnalytics';

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
  // New fields from Phase 2
  mpn?: string;
  model_number?: string;
  gtin_barcode?: string;
  supplier_item_id?: string;
  brand?: string;
  case_quantity?: number;
  fragrance_color_grade?: string;
  dilution_ratio?: string;
  sds_link?: string;
  ghs_hazard_flags: string[];
  expiration_date?: string;
  lot_batch_number?: string;
  case_cost?: number;
  cost_per_use?: number;
  billable_rule?: string;
  target_days_supply: number;
  lead_time_days: number;
}

interface LocationStockItem {
  locationId: string;
  locationName: string;
  quantity: number;
  lowStockThreshold?: number;
}

export const SimpleConsumablesInventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'analytics'>('inventory');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAduColumns, setShowAduColumns] = useState(() => {
    const saved = localStorage.getItem('consumables-show-adu-columns');
    return saved ? JSON.parse(saved) : false;
  });
  const queryClient = useQueryClient();

  // Save ADU columns preference to localStorage
  const toggleAduColumns = () => {
    const newState = !showAduColumns;
    setShowAduColumns(newState);
    localStorage.setItem('consumables-show-adu-columns', JSON.stringify(newState));
  };

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

  // Calculate services for a consumable using real data when available
  const getServicesData = (consumable: Consumable) => {
    const velocity = velocityById.get(consumable.id);
    
    // Use real usage data if available, fallback to estimated
    const dailyUsage = velocity?.adu_30 || velocity?.adu_90 || velocity?.adu_7 || 
                      (consumable.on_hand_qty / (consumable.target_days_supply || 14));
    
    const hasRealData = !!(velocity?.adu_30 || velocity?.adu_90 || velocity?.adu_7);
    
    // Assume average service uses 1 unit per day of supply for estimation
    const estimatedServicesPerDay = dailyUsage > 0 ? dailyUsage : 1;
    const servicesRemaining = estimatedServicesPerDay > 0 ? Math.floor(consumable.on_hand_qty / estimatedServicesPerDay) : 0;
    
    return {
      servicesRemaining,
      hasRealData
    };
  };

  // Determine the column header based on data types
  const getServicesColumnHeader = () => {
    if (!filteredConsumables || filteredConsumables.length === 0) return 'Est. Services';
    
    const dataTypes = filteredConsumables.map(c => getServicesData(c).hasRealData);
    const allReal = dataTypes.every(hasReal => hasReal);
    const allEstimated = dataTypes.every(hasReal => !hasReal);
    
    if (allReal) return 'Services Remaining';
    if (allEstimated) return 'Est. Services';
    return 'Services (Est./Real)';
  };

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

  const handleView = (consumable: Consumable) => {
    setSelectedConsumable(consumable);
    setShowViewModal(true);
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

  // Handle barcode scan for search
  const handleBarcodeScan = (scannedCode: string) => {
    setSearchTerm(scannedCode);
    setShowBarcodeScanner(false);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
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

          {/* Tab Navigation */}
          <div className="mt-4 flex items-center justify-between">
            <TabNav>
              <TabNav.Item
                to="/consumables"
                isActive={activeTab === 'inventory'}
                onClick={() => setActiveTab('inventory')}
              >
                Inventory
              </TabNav.Item>
              <TabNav.Item
                to="/consumables/analytics"
                isActive={activeTab === 'analytics'}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
              </TabNav.Item>
            </TabNav>
          </div>

          {/* Filters - Show for both inventory and analytics tabs */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Search</label>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name, SKU, category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowBarcodeScanner(true)}
                    className="shrink-0"
                    title="Scan barcode to search"
                  >
                    <ScanLine className="w-4 h-4" />
                  </Button>
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

        {/* Content based on active tab */}
        {activeTab === 'inventory' ? (
          <div className="space-y-6">
            {/* Inventory Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div style={{ background: 'linear-gradient(135deg, hsl(210, 15%, 94%), hsl(210, 15%, 98%))' }} className="rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Items</p>
                    <p className="text-2xl font-bold text-foreground">{filteredConsumables.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-white stroke-2" />
                  </div>
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, hsl(210, 15%, 94%), hsl(210, 15%, 98%))' }} className="rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Inventory Value</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${filteredConsumables.reduce((sum, c) => sum + (c.on_hand_qty * c.unit_cost), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white stroke-2" />
                  </div>
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, hsl(210, 15%, 94%), hsl(210, 15%, 98%))' }} className="rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Low Stock Alerts</p>
                    <p className="text-2xl font-bold text-foreground">
                      {filteredConsumables.filter(c => c.on_hand_qty <= c.reorder_threshold && c.on_hand_qty > 0).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white stroke-2" />
                  </div>
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, hsl(210, 15%, 94%), hsl(210, 15%, 98%))' }} className="rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Out of Stock</p>
                    <p className="text-2xl font-bold text-foreground">
                      {filteredConsumables.filter(c => c.on_hand_qty <= 0).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white stroke-2" />
                  </div>
                </div>
              </div>
            </div>

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
                          className="cursor-pointer select-none hover:bg-gray-50"
                          onClick={() => handleSort('on_hand_qty')}
                        >
                          <div className="flex items-center">
                            On Hand
                            {getSortIcon('on_hand_qty')}
                          </div>
                        </TableHead>
                        <TableHead className="hidden xl:table-cell">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={toggleAduColumns}
                                  className="h-auto p-1 hover:bg-gray-100"
                                >
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium">Usage</span>
                                    {showAduColumns ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </div>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Average Daily Usage (ADU) for 7, 30, and 90 day periods</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableHead>
                        {showAduColumns && (
                          <>
                            <TableHead className="hidden xl:table-cell">ADU 7</TableHead>
                            <TableHead className="hidden xl:table-cell">ADU 30</TableHead>
                            <TableHead className="hidden xl:table-cell">ADU 90</TableHead>
                          </>
                        )}
                         <TableHead className="hidden lg:table-cell">
                           <div className="flex items-center gap-1">
                             {getServicesColumnHeader()}
                             <Popover>
                               <PopoverTrigger asChild>
                                 <button 
                                   onClick={(e) => e.stopPropagation()}
                                   className="ml-1 p-0.5 hover:bg-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                 >
                                   <Info className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                                 </button>
                               </PopoverTrigger>
                               <PopoverContent className="w-80 p-4 bg-white border shadow-lg z-50" side="bottom" align="start">
                                 <div className="space-y-3">
                                   <h4 className="font-semibold text-sm">How Est. Services Works</h4>
                                   <p className="text-sm text-gray-700">
                                     This shows how many service visits can be completed with current stock.
                                   </p>
                                   <div className="space-y-2 text-sm">
                                     <div className="flex items-start gap-2">
                                       <span className="font-medium text-green-600">(R)</span>
                                       <span>Real data from actual usage history</span>
                                     </div>
                                     <div className="flex items-start gap-2">
                                       <span className="font-medium text-blue-600">(E)</span>
                                       <span>Estimated based on target days supply</span>
                                     </div>
                                   </div>
                                   <div className="pt-2 border-t border-gray-200">
                                     <p className="text-xs text-gray-600">
                                       <strong>Calculation:</strong> Current Stock ÷ Daily Usage Rate = Services Remaining
                                     </p>
                                   </div>
                                 </div>
                               </PopoverContent>
                             </Popover>
                           </div>
                         </TableHead>
                        <TableHead className="hidden md:table-cell">Locations</TableHead>
                        <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredConsumables.map((consumable) => {
                       // Get services data using velocity stats
                       const servicesData = getServicesData(consumable);
                      
                       return (
                         <TableRow key={consumable.id}>
                        <TableCell className="font-medium">
                          <div>
                            <button 
                              onClick={() => handleView(consumable)}
                              className="font-medium text-left hover:text-blue-600 hover:underline cursor-pointer"
                            >
                              {consumable.name}
                            </button>
                            <div className="text-sm text-gray-500 md:hidden">
                              {formatCategoryDisplay(consumable.category)} • {consumable.on_hand_qty} {consumable.base_unit || 'units'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{formatCategoryDisplay(consumable.category)}</TableCell>
                        <TableCell className="hidden lg:table-cell">{consumable.sku || '-'}</TableCell>
                         <TableCell>{consumable.on_hand_qty} {consumable.base_unit || 'units'}</TableCell>
                         <TableCell className="hidden xl:table-cell">
                           {/* Empty cell for the Usage Analytics header */}
                         </TableCell>
                         {showAduColumns && (
                           <>
                             <TableCell className="hidden xl:table-cell">{fmt(velocityById.get(consumable.id)?.adu_7)}</TableCell>
                             <TableCell className="hidden xl:table-cell">{fmt(velocityById.get(consumable.id)?.adu_30)}</TableCell>
                             <TableCell className="hidden xl:table-cell">{fmt(velocityById.get(consumable.id)?.adu_90)}</TableCell>
                           </>
                         )}
                         <TableCell className="hidden lg:table-cell">
                           {servicesData.servicesRemaining > 0 ? (
                             <span>
                               {servicesData.servicesRemaining} <span className="text-xs text-gray-500">({servicesData.hasRealData ? 'R' : 'E'})</span>
                             </span>
                           ) : '-'}
                         </TableCell>
                         <TableCell className="hidden md:table-cell min-w-[180px]">
                           {consumable.location_stock?.length > 0 ? (
                             <div className="space-y-2">
                                {consumable.location_stock.slice(0, 5).map((loc, index) => {
                                  const isLowStock = loc.lowStockThreshold && loc.quantity <= loc.lowStockThreshold;
                                  return (
                                    <div key={index} className={`flex items-center justify-between bg-gray-50 rounded-md px-3 py-2 text-sm ${isLowStock ? 'border border-orange-200 bg-orange-50' : ''}`}>
                                      <span className="text-gray-700 truncate flex-1 mr-2" title={loc.locationName}>{loc.locationName}</span>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <span className="font-medium text-gray-900">{loc.quantity}</span>
                                        {isLowStock && <AlertTriangle className="w-3 h-3 text-orange-500" />}
                                      </div>
                                    </div>
                                  );
                                })}
                                {consumable.location_stock.length > 5 && (
                                  <div className="text-sm text-gray-500 px-3 py-1 bg-gray-100 rounded-md text-center">
                                    +{consumable.location_stock.length - 5} more location{consumable.location_stock.length - 5 > 1 ? 's' : ''}
                                  </div>
                                )}
                             </div>
                           ) : (
                             <div className="text-center py-3">
                               <span className="text-gray-400 text-sm">No locations</span>
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
                                onClick={() => handleView(consumable)}
                                className="cursor-pointer"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
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
          </div>
        ) : (
          <SimpleConsumablesAnalytics 
            searchTerm={searchTerm}
            categoryFilter={categoryFilter}
            onViewConsumable={handleView}
          />
        )}

        {/* Modals */}
        <BarcodeScannerModal
          isOpen={showBarcodeScanner}
          onClose={() => setShowBarcodeScanner(false)}
          onScanResult={handleBarcodeScan}
        />

        <EnhancedAddConsumableModal
          isOpen={showAddModal}
          onClose={handleModalClose}
        />

        <EnhancedEditConsumableModal 
          isOpen={showEditModal}
          consumable={selectedConsumable}
          onClose={handleModalClose}
        />

        <ViewConsumableModal 
          isOpen={showViewModal}
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
