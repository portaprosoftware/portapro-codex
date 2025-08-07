import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Settings, Wrench, Plus, Minus, History, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { EditProductModal } from "./EditProductModal";
import { StockAdjustmentWizard } from "./StockAdjustmentWizard";
import { ProductStockHistory } from "./ProductStockHistory";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ItemCodeCategorySelect } from "@/components/ui/ItemCodeCategorySelect";
import { useItemCodeCategories } from "@/hooks/useCompanySettings";
import { useUnifiedStockManagement } from "@/hooks/useUnifiedStockManagement";

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
  default_item_code_category?: string;
}

interface ProductOverviewProps {
  product: Product;
  onDeleted?: () => void;
}

export const ProductOverview: React.FC<ProductOverviewProps> = ({ product, onDeleted }) => {
  const queryClient = useQueryClient();
  
  // Use unified stock management system
  const {
    stockData,
    calculations,
    isLoading: stockLoading,
    masterStock,
    physicallyAvailable,
    totalReserved,
    inMaintenance,
    trackingMethod,
    isConsistent,
    needsAttention,
    adjustMasterStock,
    syncStockTotals,
    isAdjusting,
    isSyncing
  } = useUnifiedStockManagement(product.id);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [showStockHistory, setShowStockHistory] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceQuantity, setMaintenanceQuantity] = useState(1);
  const [maintenanceNotes, setMaintenanceNotes] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(product.default_item_code_category || "");

  const { categories } = useItemCodeCategories();

  // Use unified stock data or fallback to legacy data
  const displayData = stockData ? {
    availableCount: physicallyAvailable,
    onJobCount: totalReserved,
    maintenanceCount: inMaintenance,
    
    totalStock: masterStock,
    statusData: calculations?.statusBreakdown || []
  } : {
    availableCount: product.stock_total - product.stock_in_service,
    onJobCount: product.stock_in_service,
    maintenanceCount: 0,
    
    totalStock: product.stock_total,
    statusData: []
  };

  const legacyStatusData = [
    { label: "Available", count: displayData.availableCount, color: "bg-gradient-to-r from-green-500 to-green-600", textColor: "text-green-700 font-bold" },
    { label: "On Job", count: displayData.onJobCount, color: "bg-gradient-to-r from-blue-500 to-blue-600", textColor: "text-blue-700 font-bold" },
    { label: "Maintenance", count: displayData.maintenanceCount, color: "bg-gradient-to-r from-amber-500 to-amber-600", textColor: "text-amber-700 font-bold" },
    
  ];

  const statusData = stockData && calculations?.statusBreakdown.length ? 
    calculations.statusBreakdown.map(item => ({
      label: item.label,
      count: item.count,
      color: item.color,
      textColor: `text-${item.color.split('-')[1]}-700 font-bold`,
      description: item.description
    })) : 
    legacyStatusData;

  const isLowStock = displayData.availableCount <= product.low_stock_threshold;

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

  const updateCategoryMutation = useMutation({
    mutationFn: async (category: string | null) => {
      const { error } = await supabase
        .from("products")
        .update({ default_item_code_category: category })
        .eq("id", product.id);
      
      if (error) throw error;
    },
    onSuccess: (_, category) => {
      queryClient.invalidateQueries({ queryKey: ["product", product.id] });
      if (category === null) {
        toast.success("Default category cleared");
      } else {
        toast.success("Default item code category updated");
      }
      setShowCategoryModal(false);
    },
    onError: (error) => {
      toast.error("Failed to update default category");
      console.error(error);
    }
  });

  const clearDefaultCategory = () => {
    updateCategoryMutation.mutate(null);
  };

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
    if (maintenanceQuantity > displayData.availableCount) {
      toast.error("Cannot move more units than available");
      return;
    }
    moveToMaintenanceMutation.mutate({ quantity: maintenanceQuantity, notes: maintenanceNotes });
  };

  const handleCategoryUpdate = () => {
    updateCategoryMutation.mutate(selectedCategory);
  };

  const getCategoryName = (categoryValue: string) => {
    const category = categories?.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
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
                Available
              </Badge>
            </div>
            <p className="text-gray-600 leading-relaxed">
              {product.description || "A portable toilet designed to meet the accessibility standards of the Americans with Disabilities Act (ADA). These units are designed to be accessible to individuals with disabilities, particularly those using wheelchairs, and feature wider doorways, spacious interiors, and reinforced grab bars, among other features"}
            </p>
          </div>
          <div className="flex gap-2">
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
      </div>

      {/* Inventory Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Inventory Status</h2>
              {stockData && (
                <Badge variant="outline" className="text-xs">
                  {trackingMethod} tracking
                </Badge>
              )}
              {needsAttention && (
                <Badge variant="destructive" className="text-xs">
                  Needs Attention
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                onClick={() => setShowStockAdjustment(true)}
                disabled={!product.track_inventory}
              >
                <Settings className="w-4 h-4 mr-2" />
                Adjust Stock
              </Button>
              {!isConsistent && (
                <Button 
                  variant="outline" 
                  className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                  onClick={() => syncStockTotals()}
                  disabled={isSyncing}
                >
                  {isSyncing ? "Syncing..." : "Fix Data"}
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
                <span className="font-bold text-gray-900">{status.count}</span>
                <span className={`font-bold ${status.textColor}`}>{status.label}</span>
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
                    style={{ width: `${(status.count / displayData.totalStock) * 100}%` }}
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Total Stock</span>
              <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-base px-3 py-1">
                {displayData.totalStock}
              </Badge>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Low Stock Threshold</span>
              <Badge className={`font-bold text-base px-3 py-1 ${isLowStock ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white' : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'}`}>
                {product.low_stock_threshold}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Item Code Category Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Item Code Category</h2>
          <div className="flex gap-2">
            {product.default_item_code_category && (
              <Button 
                variant="outline" 
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={clearDefaultCategory}
                disabled={updateCategoryMutation.isPending}
              >
                <Minus className="w-4 h-4 mr-2" />
                Clear Default
              </Button>
            )}
            <Button 
              variant="outline" 
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
              onClick={() => setShowCategoryModal(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Set Default Category
            </Button>
          </div>
        </div>
        
        {product.default_item_code_category ? (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  Default Category: {getCategoryName(product.default_item_code_category)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  New individual items will automatically use this category for item codes.
                </p>
              </div>
              <Badge className="bg-blue-600 text-white">
                {product.default_item_code_category}s
              </Badge>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-900 font-medium">No default category set</p>
            <p className="text-sm text-gray-600 mt-1">
              Set a default item code category to streamline individual item creation.
            </p>
          </div>
        )}
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
          <DialogHeader>
            <DialogTitle>Stock Adjustment History - {product.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            <ProductStockHistory
              productId={product.id}
              productName={product.name}
            />
          </div>
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
                max={displayData.availableCount}
                value={maintenanceQuantity}
                onChange={(e) => setMaintenanceQuantity(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available units: {displayData.availableCount}
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

      {/* Category Settings Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Default Item Code Category</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-select">Item Code Category</Label>
              <ItemCodeCategorySelect
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                placeholder="Select default category"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This category will be used automatically when creating new individual items.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCategoryUpdate}
                disabled={updateCategoryMutation.isPending || !selectedCategory}
              >
                {updateCategoryMutation.isPending ? "Updating..." : "Set Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};