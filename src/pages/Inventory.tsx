import React, { useState } from "react";
import { Plus, LayoutGrid, List, QrCode, Search, ExternalLink, BarChart3, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductGrid } from "@/components/inventory/ProductGrid";
import { ProductDetail } from "@/components/inventory/ProductDetail";
import { InventoryMapView } from "@/components/inventory/InventoryMapView";
import { StorageLocationSelector } from "@/components/inventory/StorageLocationSelector";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FilterType = "all" | "in_stock" | "low_stock" | "out_of_stock" | "available_now";
type ViewType = "grid" | "list";

const Inventory: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [viewType, setViewType] = useState<ViewType>("grid");
  const [hideInactive, setHideInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");

  const filters = [
    { key: "all" as FilterType, label: "All Products", color: "bg-blue-600 text-white", active: true },
    { key: "in_stock" as FilterType, label: "In Stock", color: "border-gray-300 text-gray-700" },
    { key: "low_stock" as FilterType, label: "Low Stock", color: "border-amber-300 text-amber-700" },
    { key: "out_of_stock" as FilterType, label: "Out of Stock", color: "border-red-300 text-red-700" },
    { key: "available_now" as FilterType, label: "Available Now", color: "border-green-300 text-green-700", icon: ExternalLink }
  ];

  if (selectedProduct) {
    return <ProductDetail productId={selectedProduct} onBack={() => setSelectedProduct(null)} />;
  }

  return (
    <div className="max-w-none px-6 py-6 space-y-6 font-inter">
      {/* Header */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 font-inter">Products</h1>
            <p className="text-base text-gray-600 font-inter mt-1">Browse your rental product catalog with real-time status tracking</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Item
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Badge
              key={filter.key}
              variant={activeFilter === filter.key ? "default" : "outline"}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 hover:shadow-md",
                activeFilter === filter.key 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "border-gray-300 text-gray-700 hover:border-gray-400"
              )}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
              {filter.icon && <filter.icon className="w-3 h-3 ml-1" />}
            </Badge>
          ))}
        </div>

        {/* Location Filter & View Controls & Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Storage Location Filter */}
            <div className="min-w-64">
              <StorageLocationSelector
                value={selectedLocationId}
                onValueChange={setSelectedLocationId}
                placeholder="Filter by storage site"
                includeAllSites={true}
              />
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewType === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewType("grid")}
                className="h-8"
              >
                <LayoutGrid className="w-4 h-4" />
                Icons
              </Button>
              <Button
                variant={viewType === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewType("list")}
                className="h-8"
              >
                <List className="w-4 h-4" />
                List
              </Button>
            </div>

            {/* Hide Inactive Toggle */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <Switch
                checked={hideInactive}
                onCheckedChange={setHideInactive}
                className="data-[state=checked]:bg-gray-600"
              />
              <span className="text-sm text-gray-700">Hide Inactive</span>
              <Badge variant="outline" className="ml-1 text-xs">1</Badge>
            </div>
          </div>

          {/* Search & QR */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search products or scan QR code"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 rounded-lg border-gray-300 focus:border-blue-400"
              />
            </div>
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <ProductGrid 
            filter={activeFilter}
            viewType={viewType}
            hideInactive={hideInactive}
            searchQuery={searchQuery}
            selectedLocationId={selectedLocationId}
            onProductSelect={setSelectedProduct}
          />
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Equipment Locations</h3>
              <p className="text-gray-600 text-sm">Real-time view of where your equipment is currently deployed</p>
            </div>
            <InventoryMapView />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inventory;