
import React, { useState } from "react";
import { Package, Plus, Minus, RotateCcw, AlertTriangle, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUnifiedStockManagement } from "@/hooks/useUnifiedStockManagement";

interface StockAdjustmentWizardProps {
  productId: string;
  productName: string;
  currentStock: number;
  onComplete: () => void;
  onCancel: () => void;
}

const increaseReasons = [
  { value: "found", label: "Found/Recovered", icon: Package },
  { value: "purchase", label: "New Purchase", icon: Plus },
  { value: "correction", label: "Inventory Correction", icon: PenTool },
  { value: "other", label: "Other", icon: Package },
];

const decreaseReasons = [
  { value: "damaged", label: "Damaged/Broken", icon: AlertTriangle },
  { value: "lost", label: "Lost/Missing", icon: Package },
  { value: "correction", label: "Inventory Correction", icon: PenTool },
  { value: "other", label: "Other", icon: Package },
];

export const StockAdjustmentWizard: React.FC<StockAdjustmentWizardProps> = ({
  productId,
  productName,
  currentStock,
  onComplete,
  onCancel
}) => {
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "decrease">("increase");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const { toast } = useToast();
  
  // Use unified stock management for proper updates
  const { adjustMasterStock, isAdjusting } = useUnifiedStockManagement(productId);

  const calculateNewStock = () => {
    switch (adjustmentType) {
      case "increase":
        return currentStock + quantity;
      case "decrease":
        return Math.max(0, currentStock - quantity);
      default:
        return currentStock;
    }
  };

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Validation Error",
        description: "Please select a reason for the adjustment.",
        variant: "destructive",
      });
      return;
    }

    const quantityChange = calculateNewStock() - currentStock;
    
    // Use unified stock management for proper real-time updates
    adjustMasterStock(
      {
        quantityChange,
        reason,
        notes: notes || null,
      },
      {
        onSuccess: () => onComplete(),
      }
    );
  };

  // Get the current reasons based on adjustment type
  const currentReasons = adjustmentType === "increase" ? increaseReasons : decreaseReasons;
  
  const selectedReason = currentReasons.find(r => r.value === reason);
  
  // Reset reason when changing adjustment type
  const handleAdjustmentTypeChange = (type: "increase" | "decrease") => {
    setAdjustmentType(type);
    setReason(""); // Clear reason when switching types
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Stock Adjustment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Product</Label>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium">{productName}</p>
            <p className="text-sm text-gray-600">Current Stock: {currentStock}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Adjustment Type</Label>
          <div className="flex gap-2">
            <Button
              variant={adjustmentType === "increase" ? "default" : "outline"}
              size="sm"
              onClick={() => handleAdjustmentTypeChange("increase")}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Increase
            </Button>
            <Button
              variant={adjustmentType === "decrease" ? "default" : "outline"}
              size="sm"
              onClick={() => handleAdjustmentTypeChange("decrease")}
              className="flex-1"
            >
              <Minus className="w-4 h-4 mr-2" />
              Decrease
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label>Reason</Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue placeholder="Select reason for adjustment" />
            </SelectTrigger>
            <SelectContent>
              {currentReasons.map((reasonOption) => (
                <SelectItem key={reasonOption.value} value={reasonOption.value}>
                  <div className="flex items-center gap-2">
                    <reasonOption.icon className="w-4 h-4" />
                    {reasonOption.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Additional details about this adjustment..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Stock Change:</span>
            <Badge variant="outline">
              {currentStock} → {calculateNewStock()}
            </Badge>
          </div>
          {selectedReason && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <selectedReason.icon className="w-4 h-4" />
              {selectedReason.label}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
            disabled={isAdjusting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={isAdjusting}
          >
            {isAdjusting ? "Processing..." : "Apply Adjustment"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
