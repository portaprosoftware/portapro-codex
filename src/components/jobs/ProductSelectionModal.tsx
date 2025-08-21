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
  attributes?: Record<string, any>;
}

interface ProductSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: string;
  endDate?: string | null;
  onProductSelect: (selections: UnitSelection[]) => void;
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

  const handleBulkSelect = (product: Product) => {
    const selection: UnitSelection = {
      unitId: 'bulk',
      itemCode: 'BULK',
      productId: product.id,
      productName: product.name
    };
    setSelectedUnitsCollection(prev => {
      // Remove any existing selections for this product
      const filtered = prev.filter(s => s.productId !== product.id);
      return [...filtered, selection];
    });
  };

  const handleUnitsSelect = (units: SelectedUnit[], productName: string) => {
    const selections: UnitSelection[] = units.map(unit => ({
      ...unit,
      productName,
      attributes: {}
    }));
    
    setSelectedUnitsCollection(prev => {
      // Remove any existing selections for this product
      const filtered = prev.filter(s => s.productId !== units[0]?.productId);
      return [...filtered, ...selections];
    });
    
    handleBackToMain();
  };

  const handleRemoveSelection = (index: number) => {
    setSelectedUnitsCollection(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddUnitsToJob = () => {
    onProductSelect(selectedUnitsCollection);
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
                <h3 className="font-medium text-sm">Selected Units ({selectedUnitsCollection.length})</h3>
                <Button
                  onClick={handleAddUnitsToJob}
                  className="font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Units to Job
                </Button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedUnitsCollection.map((selection, index) => (
                  <div key={`${selection.productId}-${selection.unitId}-${index}`} className="flex items-center justify-between bg-background border rounded-lg p-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{selection.productName}</span>
                      <span className="text-muted-foreground ml-2">
                        {selection.unitId === 'bulk' ? '(Bulk Selection)' : `Unit: ${selection.itemCode}`}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSelection(index)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
  onBulkSelect: (product: Product) => void;
  onViewTrackedUnits: (product: Product) => void;
}

const ProductListPage: React.FC<ProductListPageProps> = ({
  startDate,
  endDate,
  onBulkSelect,
  onViewTrackedUnits
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
                onBulkSelect={() => onBulkSelect(product)}
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
  onBulkSelect: () => void;
  onViewTrackedUnits: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  startDate,
  endDate,
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

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={onBulkSelect}
          >
            <Layers className="h-3 w-3 mr-1" />
            Select Bulk
          </Button>
          
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