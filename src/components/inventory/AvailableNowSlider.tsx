import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Package, MapPin, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvailableNowSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AvailableNowSlider: React.FC<AvailableNowSliderProps> = ({ isOpen, onClose }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Fetch all products with their inventory data
  const { data: productsWithItems = [], isLoading } = useQuery({
    queryKey: ['products-with-items'],
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
        .eq('track_inventory', true)
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
            Individual Units Overview
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
                          Total Stock: {product.stock_total} | Individual Units: {product.items.length}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold px-3 py-1 rounded-full text-xs">
                        {product.items.length} Units
                      </div>
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
                    <div className="space-y-3">
                      {product.items.map((item) => (
                        <div key={item.id} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900">{item.item_code}</span>
                                <Badge 
                                  variant="outline" 
                                  className="bg-green-50 text-green-700 border-green-200 text-xs"
                                >
                                  {item.status}
                                </Badge>
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
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
          
          {!isLoading && productsWithItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No individual units found</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};