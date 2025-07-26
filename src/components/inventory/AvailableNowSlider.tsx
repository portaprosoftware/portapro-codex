import React, { useState } from "react";
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

  // Mock data for now - this will be replaced with actual data fetching
  const mockProductsWithItems = [
    {
      id: "1",
      name: "Portable Toilets - Standard",
      stock_total: 50,
      available_count: 12,
      items: [
        {
          id: "item1",
          item_code: "PT001",
          status: "available",
          condition: "Good",
          location: "Warehouse A",
          color: "Blue",
          size: "Standard",
          material: "Plastic",
          winterized: false
        },
        {
          id: "item2", 
          item_code: "PT002",
          status: "available",
          condition: "Excellent",
          location: "Warehouse A",
          color: "Blue",
          size: "Standard", 
          material: "Plastic",
          winterized: true
        }
      ]
    },
    {
      id: "2",
      name: "Hand Wash Stations",
      stock_total: 25,
      available_count: 8,
      items: [
        {
          id: "item3",
          item_code: "HW001",
          status: "available",
          condition: "Good",
          location: "Warehouse B",
          color: "White",
          size: "Standard",
          material: "Plastic",
          winterized: false
        }
      ]
    }
  ];

  const toggleSection = (productId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-1/2 sm:max-w-none overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Available Inventory Breakdown
          </SheetTitle>
          <SheetDescription>
            View all available products and their individual units currently in stock
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {mockProductsWithItems.map((product) => (
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
                          Total Stock: {product.stock_total} | Available Units: {product.available_count}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {product.available_count} Available
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
          
          {mockProductsWithItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No available inventory found</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};