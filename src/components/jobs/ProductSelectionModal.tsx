import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NumberInput } from '@/components/ui/number-input';
import { useAvailabilityEngine } from '@/hooks/useAvailabilityEngine';
import { DateRangeAvailabilityChecker } from '@/components/inventory/DateRangeAvailabilityChecker';
import { Search, Package, Eye, Layers, ArrowLeft, Plus, Trash2, Calendar } from 'lucide-react';
import { PRODUCT_TYPES, type ProductType } from '@/lib/productTypes';
import { TrackedUnitsPage } from './TrackedUnitsPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Product {
  id: string;
  name: string;
  stock_total: number;
  image_url?: string;
  track_inventory: boolean;
}

interface SelectedUnit {
  unitId: string;
  itemCode: string;
  productId: string;
}

interface UnitSelection {
  unitId: string;
  itemCode: string;
  productId: string;
  productName: string;
  quantity: number;
  attributes?: Record<string, any>;
}

interface ProductSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: string;
  endDate?: string | null;
  onProductSelect: (jobItems: import('@/contexts/JobWizardContext').JobItemSelection[]) => void;
  selectedProductId?: string;
  existingJobItems?: import('@/contexts/JobWizardContext').JobItemSelection[];
}

export const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  open,
  onOpenChange,
  startDate,
  endDate,
  onProductSelect,
  selectedProductId,
  existingJobItems = []
}) => {
  const [currentPage, setCurrentPage] = useState<'main' | 'tracked-units'>('main');
  const [selectedProductForTracking, setSelectedProductForTracking] = useState<Product | null>(null);
  const [selectedUnitsCollection, setSelectedUnitsCollection] = useState<UnitSelection[]>([]);

  // Get current selections from existing job items for display
  const currentSelections = useMemo(() => {
    const selections: Record<string, { specific: string[] }> = {};
    existingJobItems.forEach(item => {
      if (!selections[item.product_id]) {
        selections[item.product_id] = { specific: [] };
      }
      if (item.strategy === 'specific' && item.specific_item_ids) {
        selections[item.product_id].specific.push(...item.specific_item_ids);
      }
    });
    return selections;
  }, [existingJobItems]);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentPage('main');
      setSelectedProductForTracking(null);
      setSelectedUnitsCollection([]);
    }
  }, [open]);

  const handleViewTrackedUnits = (product: Product) => {
    setSelectedProductForTracking(product);
    setCurrentPage('tracked-units');
  };

  const handleBackToMain = () => {
    setCurrentPage('main');
    setSelectedProductForTracking(null);
  };

  const handleQuantitySelect = (product: Product, quantity: number) => {
    if (quantity <= 0) return;
    
    // Auto-assign specific units
    autoAssignUnits(product, quantity);
  };

  const autoAssignUnits = async (product: Product, quantity: number) => {
    try {
      // Get available units for this product
      const { data: availableUnits, error } = await supabase
        .from('product_items')
        .select('id, item_code')
        .eq('product_id', product.id)
        .eq('status', 'available')
        .limit(quantity);
      
      if (error) throw error;
      
      if (!availableUnits || availableUnits.length < quantity) {
        toast.error(`Only ${availableUnits?.length || 0} units available, requested ${quantity}`);
        return;
      }
      
      // Convert to unit selections
      const selections: UnitSelection[] = availableUnits.map(unit => ({
        unitId: unit.id,
        itemCode: unit.item_code,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        attributes: {}
      }));
      
      setSelectedUnitsCollection(prev => {
        // Remove any existing selections for this product
        const filtered = prev.filter(s => s.productId !== product.id);
        return [...filtered, ...selections];
      });
      
      toast.success(`Auto-assigned ${quantity} specific units for ${product.name}`);
      
    } catch (error: any) {
      toast.error(`Failed to auto-assign units: ${error.message}`);
    }
  };

  const handleUnitsSelect = (units: SelectedUnit[], productName: string) => {
    const selections: UnitSelection[] = units.map(unit => ({
      ...unit,
      productName,
      quantity: 1, // Each specific unit has quantity 1
      attributes: {}
    }));
    
    const productId = units[0]?.productId;
    if (!productId) return;
    
    setSelectedUnitsCollection(prev => {
      // Remove any existing SPECIFIC unit selections for this product, but keep bulk selections
      const filtered = prev.filter(s => !(s.productId === productId && s.unitId !== 'bulk'));
      const newCollection = [...filtered, ...selections];
      
      // Check if there are existing bulk selections for this product that need adjustment
      const existingBulk = filtered.find(s => s.productId === productId && s.unitId === 'bulk');
      if (existingBulk) {
        // Use availability data instead of stock_total to get actual available units
        const availabilityQuery = supabase.rpc('get_product_availability_enhanced', {
          product_type_id: productId,
          start_date: startDate,
          end_date: endDate || startDate
        });
          
        availabilityQuery.then(({ data: availabilityData }) => {
          if (availabilityData) {
            const availability = availabilityData as any;
            const totalAvailable = Number(availability.available) || 0;
            const specificUnitsCount = selections.length;
            const remainingForBulk = Math.max(0, totalAvailable - specificUnitsCount);
            const currentBulkQuantity = existingBulk.quantity;
            
            if (currentBulkQuantity > remainingForBulk) {
              const adjustedQuantity = remainingForBulk;
              
              // Update bulk quantities state
                      // Bulk quantities no longer needed
              
              // Update the collection with adjusted bulk quantity
              setSelectedUnitsCollection(current => {
                return current.map(s => 
                  s.productId === productId && s.unitId === 'bulk'
                    ? { ...s, quantity: adjustedQuantity }
                    : s
                ).filter(s => !(s.productId === productId && s.unitId === 'bulk' && s.quantity === 0));
              });
              
              // Show notification
              import('@/hooks/use-toast').then(({ toast }) => {
                toast({
                  title: "Bulk quantity adjusted",
                  description: `Reduced bulk selection from ${currentBulkQuantity} to ${adjustedQuantity} units due to specific unit selections.`,
                  variant: adjustedQuantity === 0 ? "destructive" : "default"
                });
              });
            }
          }
        });
      }
      
      return newCollection;
    });
    
    handleBackToMain();
  };

  const handleRemoveSelection = (index: number) => {
    setSelectedUnitsCollection(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveProductSelections = (productId: string, selectionType: 'bulk' | 'specific') => {
    setSelectedUnitsCollection(prev => {
      if (selectionType === 'bulk') {
        return prev.filter(s => !(s.productId === productId && s.unitId === 'bulk'));
      } else {
        return prev.filter(s => !(s.productId === productId && s.unitId !== 'bulk'));
      }
    });
  };

  const handleAddUnitsToJob = () => {
    // Group selections by product and combine bulk + specific as total quantity
    const jobItems: any[] = [];
    const productGroups: Record<string, { bulk?: UnitSelection[], specific?: UnitSelection[] }> = {};
    
    // Group selections by product and type
    selectedUnitsCollection.forEach(selection => {
      if (!productGroups[selection.productId]) {
        productGroups[selection.productId] = {};
      }
      
      if (selection.unitId === 'bulk') {
        if (!productGroups[selection.productId].bulk) {
          productGroups[selection.productId].bulk = [];
        }
        productGroups[selection.productId].bulk!.push(selection);
      } else {
        if (!productGroups[selection.productId].specific) {
          productGroups[selection.productId].specific = [];
        }
        productGroups[selection.productId].specific!.push(selection);
      }
    });

    // Convert groups to JobItemSelection format - always use specific strategy
    Object.entries(productGroups).forEach(([productId, groups]) => {
      const hasSpecific = groups.specific && groups.specific.length > 0;
      
      if (hasSpecific) {
        // Always create specific assignments
        jobItems.push({
          product_id: productId,
          quantity: groups.specific!.length,
          strategy: 'specific' as const,
          specific_item_ids: groups.specific!.map(s => s.unitId),
          attributes: groups.specific![0].attributes
        });
      }
    });
    
    onProductSelect(jobItems);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none md:max-w-[76vw] md:min-w-[960px] md:h-auto md:max-h-[72vh] p-0 flex flex-col"
        hideCloseButton={false}
      >
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            {currentPage === 'tracked-units' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToMain}
                className="p-1 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {currentPage === 'main' ? 'Select Products' : `Select Tracked Units - ${selectedProductForTracking?.name}`}
          </DialogTitle>
        </DialogHeader>

        {/* Two-column layout for main page, single column for tracked units */}
        <div className="flex-1 min-h-0 flex"
        >
          {currentPage === 'main' ? (
            <>
              {/* Left side - Tabbed interface */}
              <div className="flex-1 flex flex-col"
              >
                <Tabs defaultValue="products" className="h-full flex flex-col">
                  <div className="p-4 border-b">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="products" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Select Products
                      </TabsTrigger>
                      <TabsTrigger value="availability" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Check Availability
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="products" className="flex-1 m-0 overflow-y-auto">
                    <ProductListPage
                      startDate={startDate}
                      endDate={endDate}
                      onQuantitySelect={handleQuantitySelect}
                      onViewTrackedUnits={handleViewTrackedUnits}
                      selectedUnitsCollection={selectedUnitsCollection}
                      currentSelections={currentSelections}
                    />
                  </TabsContent>
                  
                  <TabsContent value="availability" className="flex-1 m-0 p-4 overflow-y-auto">
                    <DateRangeAvailabilityChecker
                      productId={selectedProductId}
                      productName="All Products"
                      requestedQuantity={1}
                      className="h-full"
                    />
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Right side - Selected units sidebar - Always visible */}
              <div className="w-80 border-l bg-muted/20 flex flex-col">
                <div className="p-4 border-b bg-background">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-base">
                      Selected Units
                    </h3>
                    <Badge variant="secondary" className="font-medium">
                      {selectedUnitsCollection.reduce((total, selection) => {
                        return total + selection.quantity;
                      }, 0)} units
                    </Badge>
                  </div>
                  <Button
                    onClick={handleAddUnitsToJob}
                    className="w-full font-medium"
                    size="sm"
                    disabled={selectedUnitsCollection.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Units to Job
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedUnitsCollection.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No units selected</p>
                      <p className="text-xs mt-1">Add products to get started</p>
                    </div>
                  ) : (
                    /* Group selections by product */
                    Object.entries(
                      selectedUnitsCollection.reduce((acc, selection) => {
                        if (!acc[selection.productId]) {
                          acc[selection.productId] = {
                            productName: selection.productName,
                            bulk: [],
                            specific: []
                          };
                        }
                        if (selection.unitId === 'bulk') {
                          acc[selection.productId].bulk.push(selection);
                        } else {
                          acc[selection.productId].specific.push(selection);
                        }
                        return acc;
                      }, {} as Record<string, { productName: string; bulk: UnitSelection[]; specific: UnitSelection[] }>)
                    ).map(([productId, group]) => (
                      <div key={productId} className="bg-background border rounded-lg p-3 space-y-2">
                        <div className="font-medium text-sm">{group.productName}</div>
                        
                        {/* Show combined selection when both exist */}
                        {group.bulk.length > 0 && group.specific.length > 0 ? (
                          <div className="text-sm space-y-2">
                            <div className="text-muted-foreground">
                              Specific Units: {group.specific.map(s => s.itemCode).join(', ')}
                            </div>
                            <div className="text-muted-foreground">
                              + {group.bulk[0].quantity} Additional Bulk Units
                            </div>
                            <div className="font-medium text-primary">
                              Total: {group.specific.length + group.bulk[0].quantity} units
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveProductSelections(productId, 'specific')}
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                              >
                                Remove Specific
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveProductSelections(productId, 'bulk')}
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                              >
                                Remove Bulk
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {group.bulk.length > 0 && (
                              <div className="text-sm space-y-1">
                                <div className="text-muted-foreground">
                                  Bulk Selection: {group.bulk[0].quantity} units
                                </div>
                                <div className="font-medium text-primary">
                                  Total: {group.bulk[0].quantity} units
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveProductSelections(productId, 'bulk')}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            {group.specific.length > 0 && (
                              <div className="text-sm space-y-1">
                                <div className="text-muted-foreground">
                                  Specific Units: {group.specific.map(s => s.itemCode).join(', ')}
                                </div>
                                <div className="font-medium text-primary">
                                  Total: {group.specific.length} units
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveProductSelections(productId, 'specific')}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <TrackedUnitsPage
                product={selectedProductForTracking!}
                startDate={startDate}
                endDate={endDate}
                onUnitsSelect={handleUnitsSelect}
                onBack={handleBackToMain}
                existingSelectedUnits={[
                  // Include current session selections
                  ...selectedUnitsCollection,
                  // Also include units from existing job items as SelectedUnit objects
                  ...existingJobItems
                    .filter(item => item.product_id === selectedProductForTracking?.id && item.strategy === 'specific')
                    .flatMap(item => (item.specific_item_ids || []).map(unitId => ({
                      unitId,
                      itemCode: '', // Will be populated by the component
                      productId: item.product_id
                    })))
                ]}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Product List Page Component
interface ProductListPageProps {
  startDate: string;
  endDate?: string | null;
  onQuantitySelect: (product: Product, quantity: number) => void;
  onViewTrackedUnits: (product: Product) => void;
  selectedUnitsCollection: UnitSelection[];
  currentSelections: Record<string, { specific: string[] }>;
}

const ProductListPage: React.FC<ProductListPageProps> = ({
  startDate,
  endDate,
  onQuantitySelect,
  onViewTrackedUnits,
  selectedUnitsCollection,
  currentSelections
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('all');
  const [selectedProductType, setSelectedProductType] = useState('all');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'for-selection', searchTerm, selectedProductType, selectedLocationId],
    queryFn: async () => {
      try {
        let data = [];
        
        // First, get products that match by name or manufacturer
        let nameQuery = supabase
          .from('products')
          .select(`
            id, 
            name, 
            stock_total, 
            image_url, 
            track_inventory,
            product_location_stock(
              storage_location_id, 
              quantity, 
              storage_locations(id, name)
            )
          `)
          .order('name');

        if (searchTerm) {
          nameQuery = nameQuery.or(`name.ilike.%${searchTerm}%,manufacturer.ilike.%${searchTerm}%`);
        }

        if (selectedProductType && selectedProductType !== 'all') {
          nameQuery = nameQuery.eq('product_type', selectedProductType as ProductType);
        }

        const { data: nameResults, error: nameError } = await nameQuery;
        if (nameError) throw nameError;
        
        if (nameResults) {
          data = [...nameResults];
        }

        // If we have a search query, also search individual product items by tool number
        if (searchTerm) {
          // Get product IDs that have matching tool numbers in their items
          const { data: itemResults, error: itemError } = await supabase
            .from('product_items')
            .select('product_id')
            .ilike('tool_number', `%${searchTerm}%`);
            
          if (itemError) throw itemError;
          
          if (itemResults && itemResults.length > 0) {
            const productIds = itemResults.map(item => item.product_id);
            
            // Get full product data for products that have matching tool numbers
            let toolQuery = supabase
              .from('products')
              .select(`
                id, 
                name, 
                stock_total, 
                image_url, 
                track_inventory,
                product_location_stock(
                  storage_location_id, 
                  quantity, 
                  storage_locations(id, name)
                )
              `)
              .in('id', productIds);

            if (selectedProductType && selectedProductType !== 'all') {
              toolQuery = toolQuery.eq('product_type', selectedProductType as ProductType);
            }

            const { data: toolResults, error: toolError } = await toolQuery;
            if (toolError) throw toolError;
            
            if (toolResults) {
              // Merge with existing results, avoiding duplicates
              const existingIds = new Set(data.map(p => p.id));
              const newProducts = toolResults.filter(p => !existingIds.has(p.id));
              data = [...data, ...newProducts];
            }
          }
        }

        // Apply location filtering
        if (selectedLocationId && selectedLocationId !== 'all') {
          data = data.filter((product: any) => {
            if (product.product_location_stock && Array.isArray(product.product_location_stock)) {
              return product.product_location_stock.some((ls: any) => 
                ls?.storage_location_id === selectedLocationId && (ls?.quantity || 0) > 0
              );
            }
            return false;
          });
        }

        return data as Product[];
      } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
    },
  });

  // Fetch storage locations for the filter dropdown
  const { data: storageLocations = [] } = useQuery({
    queryKey: ['storage-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="p-6 space-y-4 flex-1 flex flex-col h-full"
    >
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by name, code, tool number, or manufacturer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
          <SelectTrigger>
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">All Locations</SelectItem>
            {storageLocations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedProductType} onValueChange={setSelectedProductType}>
          <SelectTrigger>
            <SelectValue placeholder="All Product Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Product Types</SelectItem>
            {PRODUCT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto min-h-0"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading products...</div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <div className="text-muted-foreground">
              {searchTerm ? 'No products found matching your search.' : 'No products available.'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                startDate={startDate}
                endDate={endDate}
                onQuantitySelect={onQuantitySelect}
                onViewTrackedUnits={() => onViewTrackedUnits(product)}
                selectedUnitsCollection={selectedUnitsCollection}
                currentSelections={currentSelections}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  startDate: string;
  endDate?: string | null;
  onQuantitySelect: (product: Product, quantity: number) => void;
  onViewTrackedUnits: () => void;
  selectedUnitsCollection: UnitSelection[];
  currentSelections: Record<string, { specific: string[] }>;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  startDate,
  endDate,
  onQuantitySelect,
  onViewTrackedUnits,
  selectedUnitsCollection,
  currentSelections
}) => {
  const [quantity, setQuantity] = React.useState(1);
  
  // Query to get the actual individual items count for this product
  const { data: individualItemsCount = 0 } = useQuery({
    queryKey: ['product-individual-items-count', product.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('product_items')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', product.id);
      return count || 0;
    }
  });

  
  // Get current selections for this product from the job
  const productCurrentSelections = currentSelections[product.id] || { specific: [] };
  
  const getMethodDisplayText = (method: string) => {
    switch (method) {
      case 'stock_total':
        return 'Total Stock';
      case 'individual_tracking':
        return 'Individual Units';
      case 'availability_check':
        return 'Real-time Check';
      default:
        return method;
    }
  };

  const availability = useAvailabilityEngine(
    product.id,
    startDate,
    endDate || undefined
  );

  // Calculate how many specific units are already selected for this product
  const selectedSpecificUnits = selectedUnitsCollection.filter(
    selection => selection.productId === product.id && selection.unitId !== 'bulk'
  ).length;

  // Calculate remaining available units
  const totalAvailable = availability.data?.available ?? 0;
  const alreadySelectedSpecific = productCurrentSelections.specific.length;
  const totalAlreadySelected = alreadySelectedSpecific;
  const remainingAvailable = Math.max(0, totalAvailable - selectedSpecificUnits - totalAlreadySelected);

  const getAvailabilityColor = (available: number, total: number) => {
    if (available === 0) return 'destructive';
    if (available <= total * 0.3) return 'warning';
    return 'success';
  };




  return (
    <div className="relative p-4 rounded-lg border-2 transition-all hover:shadow-md border-border hover:border-primary/50">
      {/* Current selections indicator */}
      {totalAlreadySelected > 0 && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
          {totalAlreadySelected} in job
        </div>
      )}
      
      {/* Product Image */}
      <div className="aspect-square w-full mb-3 bg-background rounded-lg flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <Package className="h-12 w-12 text-muted-foreground" />
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
        
        {/* Availability Badge */}
        <div className="flex flex-wrap gap-2">
          {availability.isLoading ? (
            <Badge variant="outline" className="text-xs">
              Loading...
            </Badge>
          ) : (
            <Badge 
              variant={getAvailabilityColor(
                availability.data?.available ?? 0, 
                availability.data?.total ?? 0
              )}
              className="text-xs font-bold text-white"
            >
              {availability.data?.available ?? 0} of {availability.data?.total ?? 0} available
            </Badge>
          )}
        </div>

        {/* Current selections display */}
        {totalAlreadySelected > 0 && (
          <div className="text-xs space-y-1 p-2 bg-muted/50 rounded">
            <div className="font-medium text-muted-foreground">Currently in job:</div>
            {alreadySelectedSpecific > 0 && (
              <div>• {alreadySelectedSpecific} specific units</div>
            )}
          </div>
        )}

        {/* Quantity Input */}
        <div className="space-y-3">
          <label className="text-xs font-medium block text-center">
            Quantity {selectedSpecificUnits > 0 && `(${remainingAvailable} remaining after ${selectedSpecificUnits} specific)`}
          </label>
          <div className="flex flex-col items-center space-y-2">
            <NumberInput
              value={quantity}
              onChange={(value) => setQuantity(Math.min(value || 1, remainingAvailable))}
              min={0}
              max={remainingAvailable}
              step={1}
              size="default"
              className="w-32 text-center"
              disabled={remainingAvailable <= 0}
              placeholder="0"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => onQuantitySelect(product, quantity)}
            disabled={!availability.data || quantity <= 0 || quantity > remainingAvailable || remainingAvailable <= 0}
          >
            <Layers className="h-3 w-3 mr-1" />
            Auto-Assign ({quantity}) Units
          </Button>
          
          {availability.data?.individual_items && availability.data.individual_items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={onViewTrackedUnits}
              disabled={false}
            >
              <Eye className="h-3 w-3 mr-1" />
              View Tracked Units ({availability.data.individual_items.length})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};