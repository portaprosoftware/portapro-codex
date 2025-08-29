import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Package, MapPin, Hash, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnifiedStockManagement } from "@/hooks/useUnifiedStockManagement";

interface AvailableNowSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductOverviewCardProps {
  productId: string;
  productName: string;
}

const TotalStockDisplay: React.FC<{ productId: string; className?: string }> = ({ productId, className = "text-sm text-gray-600" }) => {
  const { stockData, isLoading } = useUnifiedStockManagement(productId);
  
  if (isLoading || !stockData) {
    return <span className={className}>Loading...</span>;
  }
  
  return <span className={className}>{stockData.master_stock_total} total</span>;
};

const ProductOverviewCard: React.FC<ProductOverviewCardProps> = ({ productId, productName }) => {
  const { stockData, calculations, isLoading } = useUnifiedStockManagement(productId);
  
  if (isLoading || !stockData || !calculations) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-gray-900">Inventory Overview</span>
        </div>
        <div className="text-sm text-gray-500">Loading overview...</div>
      </div>
    );
  }

  const { individual_items, master_stock_total } = stockData;
  const totalOnJob = individual_items.assigned; // Units currently deployed
  const totalMaintenance = 0; // Not available in current response
  const availableTracked = individual_items.available;

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-3">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-blue-600" />
        <span className="font-medium text-gray-900">Inventory Overview</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold">
          All Tracked Inventory
        </Badge>
        
        <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white font-bold">
          {availableTracked} Available Tracked Units
        </Badge>
        
        <Badge className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-bold">
          {totalOnJob} On Job (Today)
        </Badge>
        
        <Badge className="bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold">
          {totalMaintenance} Maintenance
        </Badge>
      </div>
    </div>
  );
};

export const AvailableNowSlider: React.FC<AvailableNowSliderProps> = ({ isOpen, onClose }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const getStatusBadge = (status: string) => {
    const gradients = {
      available: "bg-gradient-to-r from-green-600 to-green-700 text-white font-bold",
      assigned: "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-bold",
      maintenance: "bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold",
      out_of_service: "bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold"
    };

    const statusLabels = {
      available: "Available",
      assigned: "On Job", 
      maintenance: "Maintenance",
      out_of_service: "Permanently Retired"
    };

    return (
      <Badge className={gradients[status as keyof typeof gradients] || gradients.available}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    );
  };

  // Fetch all products with their inventory data
  const { data: productsWithItems = [], isLoading } = useQuery({
    queryKey: ['products-with-items-all'],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          stock_total,
          track_inventory,
          product_items (
            id,
            item_code,
            status,
            condition,
            location,
            color,
            size,
            material,
            winterized
          )
        `)
        .order('name');
      
      if (error) throw error;

      return products?.map(product => ({
        ...product,
        available_count: product.product_items?.filter(item => item.status === 'available').length || 0,
        items: product.product_items || []
      })) || [];
    },
    enabled: isOpen
  });


  const toggleSection = (productId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-1/2 sm:max-w-none overflow-y-auto antialiased" style={{ WebkitFontSmoothing: 'antialiased', textRendering: 'optimizeLegibility' }}>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            All Units Overview
          </SheetTitle>
          <SheetDescription>
            View all products and their individual tracked units with detailed information
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading inventory data...
            </div>
          ) : productsWithItems.map((product) => (
            <Collapsible
              key={product.id}
              open={openSections[product.id]}
              onOpenChange={() => toggleSection(product.id)}
            >
              <div className="border rounded-lg overflow-hidden">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full p-4 h-auto justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-blue-600" />
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600">
                           Total Stock: <TotalStockDisplay productId={product.id} />
                         </p>
                      </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold">
                          <TotalStockDisplay productId={product.id} className="text-white font-bold" />
                        </Badge>
                       <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          openSections[product.id] && "rotate-180"
                        )} 
                      />
                    </div>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="border-t bg-gray-50 p-4">
                    {/* Product Overview Card */}
                    <ProductOverviewCard 
                      productId={product.id} 
                      productName={product.name}
                    />
                    
                    {/* Tracked Units Section */}
                    {product.items.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-3">Individual Tracked Units</h4>
                        <div className="space-y-3">
                          {product.items.map((item) => (
                        <div key={item.id} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900">{item.item_code}</span>
                                {getStatusBadge(item.status)}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                {item.condition && (
                                  <div>Condition: <span className="font-medium">{item.condition}</span></div>
                                )}
                                {item.color && (
                                  <div>Color: <span className="font-medium">{item.color}</span></div>
                                )}
                                {item.size && (
                                  <div>Size: <span className="font-medium">{item.size}</span></div>
                                )}
                                {item.material && (
                                  <div>Material: <span className="font-medium">{item.material}</span></div>
                                )}
                              </div>
                              
                              {item.location && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <MapPin className="w-3 h-3" />
                                  <span>{item.location}</span>
                                </div>
                              )}
                              
                              {item.winterized && (
                                <Badge variant="outline" className="w-fit text-xs">
                                  Winterized
                                </Badge>
                              )}
                            </div>
                          </div>
                          </div>
                        ))}
                        </div>
                      </div>
                    )}
                    
                    {product.items.length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No individual tracked units for this product
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
          
          {!isLoading && productsWithItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No tracked units found</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};