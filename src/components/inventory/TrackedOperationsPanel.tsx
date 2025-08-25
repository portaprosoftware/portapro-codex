import React, { useState } from "react";
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
import { RefreshCcw, Plus, X } from "lucide-react";
import { useUnifiedStockManagement } from "@/hooks/useUnifiedStockManagement";
import { toast } from "sonner";

interface TrackedOperationsPanelProps {
  productId: string;
  productName: string;
  onClose?: () => void;
}

export const TrackedOperationsPanel: React.FC<TrackedOperationsPanelProps> = ({
  productId,
  productName,
  onClose,
}) => {
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const { stockData, convertBulkToTracked, addTrackedInventory } = useUnifiedStockManagement(productId);

  const operations = [
    {
      id: "convert_bulk",
      title: "Convert Bulk Pool to Tracked Items",
      description: "Convert existing bulk units to individually tracked items. Total inventory stays the same.",
      icon: RefreshCcw,
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
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50">
          <Plus className="h-4 w-4 mr-2" />
          Add Tracked Unit
        </Button>
      </DrawerTrigger>
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
                    max={selectedOperation === "convert_bulk" ? stockData?.bulk_stock?.pool_available || 0 : undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-32"
                  />
                  {selectedOperation === "convert_bulk" && stockData?.bulk_stock?.pool_available && (
                    <p className="text-xs text-gray-600 mt-1">
                      Maximum: {stockData.bulk_stock.pool_available} bulk units available
                    </p>
                  )}
                </div>

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

          {/* Understanding Operations */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-3">Understanding Operations:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Convert:</strong> Changes bulk units to tracked without affecting total count</li>
              <li>• <strong>Add Tracked:</strong> Creates new tracked items and increases inventory</li>
            </ul>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};