import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RotateCcw, Plus, X, Package, Hash, AlertCircle } from "lucide-react";
import { useUnifiedStockManagement } from "@/hooks/useUnifiedStockManagement";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TrackedOperationsPanelProps {
  productId: string;
  productName: string;
  onClose?: () => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const TrackedOperationsPanel: React.FC<TrackedOperationsPanelProps> = ({
  productId,
  productName,
  onClose,
  trigger,
  isOpen,
  onOpenChange,
}) => {
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const { stockData, adjustMasterStock, addTrackedInventory } = useUnifiedStockManagement(productId);

  // Fetch product details for the default category
  const { data: productDetails } = useQuery({
    queryKey: ['product-details', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('default_item_code_category')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  // Fetch preview unit codes when quantity > 0 and we have a category
  const { data: previewCodes } = useQuery({
    queryKey: ['preview-unit-codes', productDetails?.default_item_code_category, quantity],
    queryFn: async () => {
      if (!productDetails?.default_item_code_category) return [];
      
      const codes = [];
      for (let i = 0; i < quantity; i++) {
        const { data, error } = await supabase.rpc('preview_next_item_code', {
          category_prefix: productDetails.default_item_code_category
        });
        
        if (error) throw error;
        
        // Generate sequential codes by incrementing the base code
        const baseCode = data;
        const numericPart = baseCode.match(/\d+$/)?.[0] || '0001';
        const prefix = baseCode.substring(0, baseCode.length - numericPart.length);
        const nextNumber = parseInt(numericPart) + i;
        const paddedNumber = nextNumber.toString().padStart(numericPart.length, '0');
        codes.push(prefix + paddedNumber);
      }
      
      return codes;
    },
    enabled: !!productDetails?.default_item_code_category && quantity > 0 && !!selectedOperation,
  });

  const operations = [
    {
      id: "add_units",
      title: "Add Units",
      description: "Add new tracked inventory units with auto-generated codes.",
      icon: Plus,
      color: "text-green-600",
    },
  ];

  const handleSubmit = async () => {
    if (!selectedOperation || quantity <= 0) return;

    try {
      if (selectedOperation === "add_units") {
        await addTrackedInventory(quantity);
        toast.success(`Successfully added ${quantity} tracked unit${quantity > 1 ? 's' : ''} to inventory`, {
          duration: 3000,
        });
      } else if (selectedOperation === "remove_units") {
        await adjustMasterStock({
          quantityChange: -quantity,
          reason: 'Removed tracked units',
          notes: `Removed ${quantity} tracked units`
        });
        toast.success(`Successfully removed ${quantity} tracked unit${quantity > 1 ? 's' : ''}`, {
          duration: 3000,
        });
      }

      // Reset state and close drawer
      setSelectedOperation(null);
      setQuantity(1);
      
      // Close the drawer after a brief delay to show success
      setTimeout(() => {
        onOpenChange?.(false);
        onClose?.();
      }, 500);
      
    } catch (error) {
      console.error("Stock operation failed:", error);
      toast.error("Operation failed. Please try again.");
    }
  };

  const selectedOp = operations.find(op => op.id === selectedOperation);

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      {trigger ? (
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      ) : (
        <DrawerTrigger asChild>
          <Button className="bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 hover:border-blue-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add Units
          </Button>
        </DrawerTrigger>
      )}
      <DrawerContent className="max-h-[85vh] w-full">
        <DrawerHeader className="relative">
          <DrawerTitle>Stock Operations - {productName}</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="sm" className="absolute top-2 right-2 p-2">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        
        <div className="px-4 pb-6 overflow-y-auto">
          {/* Stock Summary */}
          <div className="flex gap-4 mb-6">
            <Badge variant="outline" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold border-0">
              {stockData?.master_stock_total || 0} Total Units
            </Badge>
            <Badge variant="outline" className="bg-gradient-to-r from-green-600 to-green-700 text-white font-bold border-0">
              {stockData?.individual_items?.available || 0} Available
            </Badge>
          </div>

          {/* Operation Selection */}
          {!selectedOperation ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Select Operation:</h3>
                {operations.map((operation) => (
                  <div
                    key={operation.id}
                    className="p-4 border-2 rounded-lg cursor-pointer transition-all border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                    onClick={() => setSelectedOperation(operation.id)}
                  >
                    <div className="flex items-start gap-3">
                      <operation.icon className={`h-6 w-6 mt-1 ${operation.color}`} />
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-900 mb-1">
                          {operation.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {operation.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                {selectedOp && <selectedOp.icon className={`h-6 w-6 ${selectedOp.color}`} />}
                <h3 className="text-lg font-semibold">{selectedOp?.title}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={undefined}
                    value={quantity === 0 ? "" : quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setQuantity(0);
                      } else {
                        setQuantity(Math.max(1, parseInt(value) || 1));
                      }
                    }}
                    className="w-32"
                  />
                </div>

                {/* Unit Preview Section - only for add units operation */}
                {quantity > 0 && selectedOperation === "add_units" && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4 text-gray-600" />
                      <h4 className="font-semibold text-gray-900">
                        {quantity === 1 ? 'Adding Unit:' : `Adding ${quantity} Units:`}
                      </h4>
                    </div>
                    
                    {!productDetails?.default_item_code_category ? (
                      <div className="text-sm text-orange-700 bg-orange-100 p-2 rounded border border-orange-200">
                        <p>No default category set for this product. Unit codes will be generated during creation.</p>
                      </div>
                    ) : previewCodes && previewCodes.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {previewCodes.map((code, index) => (
                            <Badge key={index} variant="outline" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold border-0">
                              <Hash className="h-3 w-3 mr-1" />
                              {code}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          💡 Unit(s) will be added to the <strong>Tracked Units</strong> tab - in chronological order - to view and update.
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        <div className="animate-pulse">Generating unit codes...</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Confirm Operation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedOperation(null);
                      setQuantity(1);
                      onOpenChange?.(false);
                      onClose?.();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </DrawerContent>
    </Drawer>
  );
};