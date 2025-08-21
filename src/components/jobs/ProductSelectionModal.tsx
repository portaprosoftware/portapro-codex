import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAvailabilityEngine } from '@/hooks/useAvailabilityEngine';
import { Search, Package, Eye, Layers, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { PRODUCT_TYPES, type ProductType } from '@/lib/productTypes';
import { TrackedUnitsPage } from './TrackedUnitsPage';

interface Product {
  id: string;
  name: string;
  stock_total: number;
  image_url?: string;
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
}

export const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  open,
  onOpenChange,
  startDate,
  endDate,
  onProductSelect,
  selectedProductId
}) => {
  const [currentPage, setCurrentPage] = useState<'main' | 'tracked-units'>('main');
  const [selectedProductForTracking, setSelectedProductForTracking] = useState<Product | null>(null);
  const [selectedUnitsCollection, setSelectedUnitsCollection] = useState<UnitSelection[]>([]);
  const [bulkQuantities, setBulkQuantities] = useState<Record<string, number>>({});
  
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentPage('main');
      setSelectedProductForTracking(null);
      setSelectedUnitsCollection([]);
      setBulkQuantities({});
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

  const handleBulkSelect = (product: Product, quantity: number) => {
    if (quantity <= 0) return;
    
    const selection: UnitSelection = {
      unitId: 'bulk',
      itemCode: 'BULK',
      productId: product.id,
      productName: product.name,
      quantity
    };
    
    setSelectedUnitsCollection(prev => {
      // Remove any existing BULK selections for this product, but keep specific unit selections
      const filtered = prev.filter(s => !(s.productId === product.id && s.unitId === 'bulk'));
      return [...filtered, selection];
    });
  };

  const handleUnitsSelect = (units: SelectedUnit[], productName: string) => {
    const selections: UnitSelection[] = units.map(unit => ({
      ...unit,
      productName,
      quantity: 1, // Each specific unit has quantity 1
      attributes: {}
    }));
    
    setSelectedUnitsCollection(prev => {
      // Remove any existing SPECIFIC unit selections for this product, but keep bulk selections
      const filtered = prev.filter(s => !(s.productId === units[0]?.productId && s.unitId !== 'bulk'));
      return [...filtered, ...selections];
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

    // Convert groups to JobItemSelection format
    Object.entries(productGroups).forEach(([productId, groups]) => {
      const hasSpecific = groups.specific && groups.specific.length > 0;
      const hasBulk = groups.bulk && groups.bulk.length > 0;
      
      if (hasSpecific && hasBulk) {
        // Combine specific units + bulk quantity into one job item
        const bulkQuantity = groups.bulk![0].quantity;
        const totalQuantity = groups.specific!.length + bulkQuantity;
        
        jobItems.push({
          product_id: productId,
          quantity: totalQuantity,
          strategy: 'specific' as const,
          specific_item_ids: groups.specific!.map(s => s.unitId),
          bulk_additional: bulkQuantity, // Track how many additional bulk units
          attributes: groups.specific![0].attributes
        });
      } else if (hasSpecific) {
        // Only specific units
        jobItems.push({
          product_id: productId,
          quantity: groups.specific!.length,
          strategy: 'specific' as const,
          specific_item_ids: groups.specific!.map(s => s.unitId),
          attributes: groups.specific![0].attributes
        });
      } else if (hasBulk) {
        // Only bulk units
        jobItems.push({
          product_id: productId,
          quantity: groups.bulk![0].quantity,
          strategy: 'bulk' as const,
          specific_item_ids: undefined,
          attributes: groups.bulk![0].attributes
        });
      }
    });
    
    onProductSelect(jobItems);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none md:max-w-5xl md:h-auto md:max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b">
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

        <div className="flex-1 overflow-hidden flex flex-col">
          {currentPage === 'main' ? (
            <ProductListPage
              startDate={startDate}
              endDate={endDate}
              onBulkSelect={handleBulkSelect}
              onViewTrackedUnits={handleViewTrackedUnits}
              bulkQuantities={bulkQuantities}
              onBulkQuantityChange={setBulkQuantities}
            />
          ) : (
            <TrackedUnitsPage
              product={selectedProductForTracking!}
              startDate={startDate}
              endDate={endDate}
              onUnitsSelect={handleUnitsSelect}
              onBulkSelect={handleBulkSelect}
              onBack={handleBackToMain}
            />
          )}
          
          {/* Selected Units Summary - only show on main page */}
          {currentPage === 'main' && selectedUnitsCollection.length > 0 && (
            <div className="border-t bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">
                  Selected Units ({selectedUnitsCollection.reduce((total, selection) => {
                    return total + selection.quantity;
                  }, 0)})
                </h3>
                <Button
                  onClick={handleAddUnitsToJob}
                  className="font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Units to Job
                </Button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {/* Group selections by product */}
                {Object.entries(
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
                      <div className="text-sm space-y-1">
                        <div className="text-muted-foreground">
                          Specific Units: {group.specific.map(s => s.itemCode).join(', ')}
                        </div>
                        <div className="text-muted-foreground">
                          + {group.bulk[0].quantity} Additional Bulk Units
                        </div>
                        <div className="font-medium text-primary">
                          Total: {group.specific.length + group.bulk[0].quantity} units
                        </div>
                        <div className="flex gap-2">
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
                ))}
              </div>
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
  onBulkSelect: (product: Product, quantity: number) => void;
  onViewTrackedUnits: (product: Product) => void;
  bulkQuantities: Record<string, number>;
  onBulkQuantityChange: (quantities: Record<string, number>) => void;
}

const ProductListPage: React.FC<ProductListPageProps> = ({
  startDate,
  endDate,
  onBulkSelect,
  onViewTrackedUnits,
  bulkQuantities,
  onBulkQuantityChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('all');
  const [selectedProductType, setSelectedProductType] = useState('all');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'for-selection', searchTerm, selectedProductType],
    queryFn: async () => {
      try {
        let data = [];
        
        // First, get products that match by name or manufacturer
        let nameQuery = supabase
          .from('products')
          .select('id, name, stock_total, image_url')
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
              .select('id, name, stock_total, image_url')
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

        return data as Product[];
      } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
    },
  });

  return (
    <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
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
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="yard">Yard</SelectItem>
            <SelectItem value="field">Field</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
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
      <div className="flex-1 overflow-auto">
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
                quantity={bulkQuantities[product.id] || 1}
                onQuantityChange={(qty) => onBulkQuantityChange({
                  ...bulkQuantities,
                  [product.id]: qty
                })}
                onBulkSelect={() => onBulkSelect(product, bulkQuantities[product.id] || 1)}
                onViewTrackedUnits={() => onViewTrackedUnits(product)}
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
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onBulkSelect: () => void;
  onViewTrackedUnits: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  startDate,
  endDate,
  quantity,
  onQuantityChange,
  onBulkSelect,
  onViewTrackedUnits
}) => {
  
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


  const getAvailabilityColor = (available: number, total: number) => {
    if (available === 0) return 'destructive';
    if (available <= total * 0.3) return 'warning';
    return 'success';
  };

  const getTrackingMethodBadge = (method: string) => {
    console.log('ProductSelectionModal: getTrackingMethodBadge called with method:', method);
    switch (method) {
      case 'hybrid_tracking':
        return 'Hybrid Tracking';
      case 'bulk_only':
        return 'Bulk Only';
      case 'individual_tracking':
        return 'Individual Tracking';
      default:
        return null;
    }
  };


  return (
    <div className="relative p-4 rounded-lg border-2 transition-all hover:shadow-md border-border hover:border-primary/50">
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
            <>
              <Badge 
                variant={getAvailabilityColor(
                  availability.data?.available ?? 0, 
                  availability.data?.total ?? 0
                )}
                className="text-xs font-bold text-white"
              >
                {availability.data?.available ?? 0} of {availability.data?.total ?? 0} available
              </Badge>
              {availability.data?.method && getTrackingMethodBadge(availability.data.method) && (
                <Badge 
                  variant="info"
                  className="text-xs font-bold text-white"
                >
                  {getTrackingMethodBadge(availability.data.method)}
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <label className="text-xs font-medium">Quantity</label>
          <Input
            type="number"
            min={1}
            max={availability.data?.available || undefined}
            value={quantity}
            onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
            className="h-8 text-xs"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* Only show bulk button for products that support bulk operations */}
          {availability.data?.method !== 'individual_tracking' && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={onBulkSelect}
              disabled={!availability.data || quantity <= 0 || quantity > (availability.data?.available ?? 0)}
            >
              <Layers className="h-3 w-3 mr-1" />
              Add Bulk ({quantity})
            </Button>
          )}
          
          {availability.data?.individual_items && availability.data.individual_items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={onViewTrackedUnits}
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