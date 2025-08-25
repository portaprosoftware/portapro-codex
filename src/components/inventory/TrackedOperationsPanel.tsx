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
  const { stockData, convertBulkToTracked, addTrackedInventory, adjustMasterStock } = useUnifiedStockManagement(productId);

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
      id: "convert_bulk",
      title: "Convert Bulk Pool to Tracked Items",
      description: "Convert existing bulk units to individually tracked items. Total inventory stays the same.",
      icon: RotateCcw,
      color: "text-blue-600",
      disabled: !stockData?.bulk_stock?.pool_available || stockData.bulk_stock.pool_available === 0,
    },
    {
      id: "add_tracked",
      title: "Add New Tracked Inventory",
      description: "Add new inventory as individually tracked items. Increases total inventory.",
      icon: Plus,
      color: "text-green-600",
      disabled: false,
    },
    {
      id: "add_bulk",
      title: "Add Bulk Inventory",
      description: "Add new inventory to the bulk pool. Increases total inventory.",
      icon: Plus,
      color: "text-purple-600",
      disabled: false,
    },
    {
      id: "remove_bulk",
      title: "Remove Bulk Inventory", 
      description: "Remove inventory from the bulk pool. Decreases total inventory.",
      icon: AlertCircle,
      color: "text-orange-600",
      disabled: !stockData?.bulk_stock?.pool_available || stockData.bulk_stock.pool_available === 0,
    },
  ];

  const handleSubmit = async () => {
    if (!selectedOperation || quantity <= 0) return;

    try {
      if (selectedOperation === "convert_bulk") {
        await convertBulkToTracked(quantity);
        toast.success(`Successfully converted ${quantity} bulk units to tracked items`);
      } else if (selectedOperation === "add_tracked") {
        await addTrackedInventory(quantity);
        toast.success(`Successfully added ${quantity} new tracked items`);
      } else if (selectedOperation === "add_bulk") {
        await adjustMasterStock({
          quantityChange: quantity,
          reason: 'Added bulk inventory',
          notes: `Added ${quantity} units to bulk pool`
        });
        toast.success(`Successfully added ${quantity} units to bulk pool`);
      } else if (selectedOperation === "remove_bulk") {
        await adjustMasterStock({
          quantityChange: -quantity,
          reason: 'Removed bulk inventory',
          notes: `Removed ${quantity} units from bulk pool`
        });
        toast.success(`Successfully removed ${quantity} units from bulk pool`);
      }

      setSelectedOperation(null);
      setQuantity(1);
      onClose?.();
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
            Add Tracked Unit
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
              {stockData?.master_stock || 0} Total
            </Badge>
            <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0">
              {stockData?.bulk_stock?.pool_available || 0} Bulk Pool
            </Badge>
            <Badge variant="outline" className="bg-gradient-to-r from-green-600 to-green-700 text-white font-bold border-0">
              {stockData?.individual_items?.available || 0} Tracked Available
            </Badge>
          </div>

          {/* Operation Selection */}
          {!selectedOperation ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Select Operation:</h3>
              {operations.map((operation) => (
                <div
                  key={operation.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    operation.disabled
                      ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                  onClick={() => !operation.disabled && setSelectedOperation(operation.id)}
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
                      {operation.disabled && operation.id === "convert_bulk" && (
                        <p className="text-xs text-red-600 mt-1">
                          No bulk units available to convert
                        </p>
                      )}
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
                    max={
                      (selectedOperation === "convert_bulk" || selectedOperation === "remove_bulk") 
                        ? stockData?.bulk_stock?.pool_available || 0 
                        : undefined
                    }
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
                  {selectedOperation === "convert_bulk" && stockData?.bulk_stock?.pool_available && (
                    <p className="text-xs text-gray-600 mt-1">
                      Maximum: {stockData.bulk_stock.pool_available} bulk units available
                    </p>
                  )}
                  {selectedOperation === "remove_bulk" && stockData?.bulk_stock?.pool_available && (
                    <p className="text-xs text-gray-600 mt-1">
                      Maximum: {stockData.bulk_stock.pool_available} bulk units available
                    </p>
                  )}
                </div>

                {/* Unit Preview Section - only for tracked operations */}
                {quantity > 0 && (selectedOperation === "convert_bulk" || selectedOperation === "add_tracked") && (
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
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Understanding Inventory Operations */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-4">Understanding Inventory Operations</h4>
            
            <div className="space-y-4 text-sm">
              {/* Convert Operation */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-foreground">1. Convert</span>
                </div>
                <div className="space-y-1 text-muted-foreground ml-4">
                  <div><strong>Before:</strong> Bulk = 50, Tracked = 0 → Total = 50</div>
                  <div>You convert 10 bulk units into tracked units.</div>
                  <div><strong>After:</strong> Bulk = 40, Tracked = 10 → Total = 50</div>
                </div>
              </div>

              {/* Add Tracked Operation */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-foreground">2. Add Tracked</span>
                </div>
                <div className="space-y-1 text-muted-foreground ml-4">
                  <div><strong>Before:</strong> Bulk = 50, Tracked = 0 → Total = 50</div>
                  <div>You add 5 new tracked units with serial numbers.</div>
                  <div><strong>After:</strong> Bulk = 50, Tracked = 5 → Total = 55</div>
                </div>
              </div>

              {/* Add Bulk Operation */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-foreground">3. Add Bulk</span>
                </div>
                <div className="space-y-1 text-muted-foreground ml-4">
                  <div><strong>Before:</strong> Bulk = 50, Tracked = 0 → Total = 50</div>
                  <div>You add 10 new units to the bulk pool.</div>
                  <div><strong>After:</strong> Bulk = 60, Tracked = 0 → Total = 60</div>
                </div>
              </div>

              {/* Remove Bulk Operation */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-foreground">4. Remove Bulk</span>
                </div>
                <div className="space-y-1 text-muted-foreground ml-4">
                  <div><strong>Before:</strong> Bulk = 50, Tracked = 0 → Total = 50</div>
                  <div>You remove 10 units from the bulk pool.</div>
                  <div><strong>After:</strong> Bulk = 40, Tracked = 0 → Total = 40</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};