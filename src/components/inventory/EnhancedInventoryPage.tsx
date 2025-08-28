
import React, { useState } from "react";
import { Plus, QrCode, Settings, BarChart3, FileText, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InventoryDashboard } from "./InventoryDashboard";
import { ProductGrid } from "./ProductGrid";
import { QRCodeScanner } from "./QRCodeScanner";
import { StockAdjustmentWizard } from "./StockAdjustmentWizard";
import { ItemCodeCategoryManagement } from "./ItemCodeCategoryManagement";

interface EnhancedInventoryPageProps {
  onProductSelect: (productId: string) => void;
}

export const EnhancedInventoryPage: React.FC<EnhancedInventoryPageProps> = ({ onProductSelect }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    stock: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filter, setFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [hideInactive, setHideInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleScanResult = (result: string) => {
    console.log("Scanned result:", result);
    setShowScanner(false);
    
    // Parse the QR code result and navigate to the item
    try {
      const data = JSON.parse(result);
      if (data.type === "inventory_item" && data.itemId) {
        // Navigate to the specific item
        // This would typically involve routing to the item detail page
        console.log("Navigating to item:", data.itemId);
      }
    } catch (error) {
      console.error("Failed to parse QR code:", error);
    }
  };

  const handleAdjustmentComplete = () => {
    setShowAdjustment(false);
    setSelectedProduct(null);
    // Refresh the data
    window.location.reload();
  };

  const openAdjustment = (product: { id: string; name: string; stock: number }) => {
    setSelectedProduct(product);
    setShowAdjustment(true);
  };

  return (
    <div className="p-6 space-y-6 font-inter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Monitor and manage your equipment inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowScanner(true)}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Scan QR Code
          </Button>
          <Button
            onClick={() => openAdjustment({ id: "sample", name: "Sample Product", stock: 10 })}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            + Add Units
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <InventoryDashboard />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <div className="space-y-6">
            {/* Item Code Category Management */}
            <ItemCodeCategoryManagement />

            {/* Filter Controls */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as typeof filter)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Products</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewType === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewType("grid")}
                >
                  Grid
                </Button>
                <Button
                  variant={viewType === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewType("list")}
                >
                  List
                </Button>
              </div>
            </div>

            {/* Product Grid */}
            <ProductGrid
              filter={filter}
              viewType={viewType}
              hideInactive={hideInactive}
              searchQuery={searchQuery}
              onProductSelect={onProductSelect}
            />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Inventory Reports</h3>
            <p className="text-gray-600">
              Generate detailed reports on stock levels, utilization, and movements
            </p>
            <Button className="mt-4">
              Generate Report
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* QR Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
          </DialogHeader>
          <QRCodeScanner
            onScan={handleScanResult}
            onClose={() => setShowScanner(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustment} onOpenChange={setShowAdjustment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>+ Add Units</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <StockAdjustmentWizard
              productId={selectedProduct.id}
              productName={selectedProduct.name}
              currentStock={selectedProduct.stock || 0}
              onComplete={handleAdjustmentComplete}
              onCancel={() => setShowAdjustment(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
