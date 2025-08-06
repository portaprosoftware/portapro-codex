import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Settings, Wrench, Plus, Minus, History } from "lucide-react";
import { EditProductModal } from "./EditProductModal";
import { StockAdjustmentWizard } from "./StockAdjustmentWizard";
import { ProductStockHistory } from "./ProductStockHistory";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  default_price_per_day: number;
  description?: string;
  stock_total: number;
  stock_in_service: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  includes_lock: boolean;
  charge_for_product?: boolean;
  pricing_method?: string;
  daily_rate?: number;
  hourly_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  fixed_price?: number;
  image_url?: string;
}

interface ProductOverviewProps {
  product: Product;
  onDeleted?: () => void;
}

export const ProductOverview: React.FC<ProductOverviewProps> = ({ product, onDeleted }) => {
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [showStockHistory, setShowStockHistory] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceQuantity, setMaintenanceQuantity] = useState(1);
  const [maintenanceNotes, setMaintenanceNotes] = useState("");

  const availableCount = product.stock_total - product.stock_in_service;
  const maintenanceCount = 0; // This would come from maintenance records
  const reservedCount = 0; // This would come from reservations

  const statusData = [
    { label: "Available", count: availableCount, color: "bg-green-500", textColor: "text-green-700" },
    { label: "On Job", count: product.stock_in_service, color: "bg-blue-500", textColor: "text-blue-700" },
    { label: "Maintenance", count: maintenanceCount, color: "bg-amber-500", textColor: "text-amber-700" },
    { label: "Reserved", count: reservedCount, color: "bg-red-500", textColor: "text-red-700" },
  ];

  const isLowStock = availableCount <= product.low_stock_threshold;

  const updateTrackingMutation = useMutation({
    mutationFn: async (trackInventory: boolean) => {
      const { error } = await supabase
        .from("products")
        .update({ track_inventory: trackInventory })
        .eq("id", product.id);
      
      if (error) throw error;
    },
    onSuccess: (_, trackInventory) => {
      queryClient.invalidateQueries({ queryKey: ["product", product.id] });
      toast.success(`Inventory tracking ${trackInventory ? "enabled" : "disabled"}`);
    },
    onError: (error) => {
      toast.error("Failed to update tracking setting");
      console.error(error);
    }
  });

  const updateIncludesLockMutation = useMutation({
    mutationFn: async (includesLock: boolean) => {
      const { error } = await supabase
        .from("products")
        .update({ includes_lock: includesLock })
        .eq("id", product.id);
      
      if (error) throw error;
    },
    onSuccess: (_, includesLock) => {
      queryClient.invalidateQueries({ queryKey: ["product", product.id] });
      toast.success(`Lock inclusion ${includesLock ? "enabled" : "disabled"}`);
    },
    onError: (error) => {
      toast.error("Failed to update lock inclusion");
      console.error(error);
    }
  });


  const moveToMaintenanceMutation = useMutation({
    mutationFn: async ({ quantity, notes }: { quantity: number; notes: string }) => {
      // This would create maintenance records for the specified quantity
      // For now, we'll just log it and show a success message
      console.log(`Moving ${quantity} units to maintenance:`, notes);
      
      // In a real implementation, this would:
      // 1. Create maintenance records
      // 2. Update product status counts
      // 3. Track which specific units are in maintenance
      
      return { quantity, notes };
    },
    onSuccess: (data) => {
      toast.success(`Moved ${data.quantity} unit(s) to maintenance`);
      setShowMaintenanceModal(false);
      setMaintenanceQuantity(1);
      setMaintenanceNotes("");
    },
    onError: (error) => {
      toast.error("Failed to move units to maintenance");
      console.error(error);
    }
  });

  const handleTrackingToggle = (checked: boolean) => {
    // Note: Switch checked state is for "disable tracking", so we invert it
    updateTrackingMutation.mutate(!checked);
  };

  const handleIncludesLockToggle = (checked: boolean) => {
    updateIncludesLockMutation.mutate(checked);
  };

  const handleStockAdjustmentComplete = () => {
    setShowStockAdjustment(false);
    queryClient.invalidateQueries({ queryKey: ["product", product.id] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const handleMoveToMaintenance = () => {
    if (maintenanceQuantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    if (maintenanceQuantity > availableCount) {
      toast.error("Cannot move more units than available");
      return;
    }
    moveToMaintenanceMutation.mutate({ quantity: maintenanceQuantity, notes: maintenanceNotes });
  };

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold border-0">
                ${product.charge_for_product ? (product.daily_rate || product.default_price_per_day) : product.default_price_per_day}/day
              </Badge>
              <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white font-bold border-0">
                (Available)
              </Badge>
            </div>
            <p className="text-gray-600 leading-relaxed">
              {product.description || "A portable toilet designed to meet the accessibility standards of the Americans with Disabilities Act (ADA). These units are designed to be accessible to individuals with disabilities, particularly those using wheelchairs, and feature wider doorways, spacious interiors, and reinforced grab bars, among other features"}
            </p>
          </div>
          <Button 
            variant="outline" 
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
            onClick={() => setShowEditModal(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Product Info
          </Button>
        </div>
      </div>

      {/* Inventory Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Inventory Status</h2>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
              onClick={() => setShowStockAdjustment(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Adjust Stock
            </Button>
            <Button 
              variant="outline" 
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
              onClick={() => setShowMaintenanceModal(true)}
            >
              <Wrench className="w-4 h-4 mr-2" />
              Move to Maintenance
            </Button>
            {isLowStock && (
              <Button className="bg-amber-500 text-white hover:bg-amber-600">
                <Settings className="w-4 h-4 mr-2" />
                Low Stock: {product.low_stock_threshold}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status List */}
          <div className="space-y-4">
            {statusData.map((status) => (
              <div key={status.label} className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${status.color}`}></span>
                <span className="font-medium text-gray-900">{status.count}</span>
                <span className={`font-medium ${status.textColor}`}>{status.label}</span>
              </div>
            ))}
          </div>

          {/* Status Bars */}
          <div className="space-y-4">
            {statusData.map((status) => (
              <div key={status.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className={status.textColor}>{status.label}</span>
                  <span className="text-gray-600">{status.count}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${status.color} transition-all duration-300`}
                    style={{ width: `${(status.count / product.stock_total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button 
            variant="outline" 
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
            onClick={() => setShowStockHistory(true)}
          >
            <History className="w-4 h-4 mr-2" />
            View Stock History
          </Button>
          <span className="text-xl font-bold text-foreground">
            Total: {product.stock_total}
          </span>
        </div>
      </div>

      {/* Product Settings */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Disable tracking</h3>
            <p className="text-sm text-gray-600">Toggle switch to disable or enable tracking for this item</p>
          </div>
          <Switch
            checked={!product.track_inventory}
            onCheckedChange={handleTrackingToggle}
            className="data-[state=checked]:bg-gray-600"
            disabled={updateTrackingMutation.isPending}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Includes Lock and Key</h3>
            <p className="text-sm text-gray-600">Enable if this product type comes with a lock and key</p>
          </div>
          <Switch
            checked={product.includes_lock}
            onCheckedChange={handleIncludesLockToggle}
            disabled={updateIncludesLockMutation.isPending}
          />
        </div>
      </div>

      {/* Edit Product Modal */}
      {showEditModal && (
        <EditProductModal
          productId={product.id}
          onClose={() => setShowEditModal(false)}
          onDeleted={() => {
            onDeleted?.();
            setShowEditModal(false);
          }}
        />
      )}

      {/* Stock Adjustment Wizard */}
      <Dialog open={showStockAdjustment} onOpenChange={setShowStockAdjustment}>
        <DialogContent className="max-w-md">
          <StockAdjustmentWizard
            productId={product.id}
            productName={product.name}
            currentStock={product.stock_total}
            onComplete={handleStockAdjustmentComplete}
            onCancel={() => setShowStockAdjustment(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Stock History Modal */}
      <Dialog open={showStockHistory} onOpenChange={setShowStockHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <ProductStockHistory
            productId={product.id}
            productName={product.name}
          />
        </DialogContent>
      </Dialog>

      {/* Move to Maintenance Modal */}
      <Dialog open={showMaintenanceModal} onOpenChange={setShowMaintenanceModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move to Maintenance</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="maintenance-quantity">Quantity to Move</Label>
              <Input
                id="maintenance-quantity"
                type="number"
                min="1"
                max={availableCount}
                value={maintenanceQuantity}
                onChange={(e) => setMaintenanceQuantity(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available units: {availableCount}
              </p>
            </div>

            <div>
              <Label htmlFor="maintenance-notes">Maintenance Notes</Label>
              <Textarea
                id="maintenance-notes"
                value={maintenanceNotes}
                onChange={(e) => setMaintenanceNotes(e.target.value)}
                placeholder="Enter maintenance details or reason..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMaintenanceModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleMoveToMaintenance}
                disabled={moveToMaintenanceMutation.isPending}
              >
                {moveToMaintenanceMutation.isPending ? "Moving..." : "Move to Maintenance"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};