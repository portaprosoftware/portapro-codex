import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutGrid, List, QrCode, Search, SlidersHorizontal, BarChart3, MapPin, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductGrid } from "@/components/inventory/ProductGrid";
import { ProductDetail } from "@/components/inventory/ProductDetail";
import { InventoryMapView } from "@/components/inventory/InventoryMapView";
import { StorageLocationSelector } from "@/components/inventory/StorageLocationSelector";
import { AvailableNowSlider } from "@/components/inventory/AvailableNowSlider";
import { LocationAwareAvailableSlider } from "@/components/inventory/LocationAwareAvailableSlider";
import { AddInventoryModal } from "@/components/inventory/AddInventoryModal";
import { OCRQualityDashboard } from "@/components/inventory/OCRQualityDashboard";
import { OfflineOCRCapture } from "@/components/inventory/OfflineOCRCapture";
import { OCRSearchCapture } from "@/components/inventory/OCRSearchCapture";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type FilterType = "all" | "in_stock" | "low_stock" | "out_of_stock" | "available_now";
type ViewType = "grid" | "list";

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [viewType, setViewType] = useState<ViewType>("grid");
  const [hideInactive, setHideInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");
  const [isAvailableSliderOpen, setIsAvailableSliderOpen] = useState(false);
  const [addInventoryModalOpen, setAddInventoryModalOpen] = useState(false);
  const [showOCRDashboard, setShowOCRDashboard] = useState(false);
  const [showOCRSearch, setShowOCRSearch] = useState(false);
  const [toolNumberToFind, setToolNumberToFind] = useState<string | null>(null);
  const [matchingItemId, setMatchingItemId] = useState<string | null>(null);

  // Auto-search with debouncing
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        handleAutoSearch(searchQuery);
      } else {
        setMatchingItemId(null);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleAutoSearch = async (searchTerm: string) => {
    console.log("Auto Search: Starting search for:", searchTerm);
    
    try {
      const { data: items, error } = await supabase
        .from("product_items")
        .select("product_id, tool_number, id")
        .ilike("tool_number", `%${searchTerm}%`)
        .limit(1);
        
      if (error) throw error;
      
      if (items && items.length > 0) {
        console.log("Auto Search: Found matching individual item:", items[0].id);
        setMatchingItemId(items[0].id);
      } else {
        console.log("Auto Search: No individual items found");
        setMatchingItemId(null);
      }
    } catch (error) {
      console.error("Auto search error:", error);
      setMatchingItemId(null);
    }
  };

  const handleFilterClick = (filterKey: FilterType) => {
    if (filterKey === "available_now") {
      setIsAvailableSliderOpen(true);
    } else {
      setActiveFilter(filterKey);
    }
  };

  const getFilterStyle = (filterKey: FilterType) => {
    const isActive = activeFilter === filterKey;
    
    if (filterKey === "available_now") {
      return "border-blue-300 text-blue-700 hover:border-blue-400 hover:bg-blue-50";
    }
    
    if (isActive) {
      switch (filterKey) {
        case "in_stock":
          return "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600 hover:from-green-600 hover:to-green-700";
        case "low_stock":
          return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-600 hover:from-yellow-600 hover:to-yellow-700";
        case "out_of_stock":
          return "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600 hover:from-red-600 hover:to-red-700";
        default:
          return "bg-blue-600 text-white border-blue-600";
      }
    }
    
    return "border-gray-300 text-gray-700 hover:border-gray-400";
  };

  const handleOCRSearchResult = async (searchTerm: string, confidence?: number) => {
    console.log("OCR Search: Starting search for:", searchTerm);
    setShowOCRSearch(false);
    
    // First, search for individual product items with this tool number
    try {
      const { data: items, error } = await supabase
        .from("product_items")
        .select("product_id, tool_number, id")
        .ilike("tool_number", `%${searchTerm}%`)
        .limit(1);
        
      if (error) throw error;
      
      console.log("OCR Search: Found items:", items);
      
      if (items && items.length > 0) {
        // Found an individual unit with this tool number - navigate directly to its page
        const itemId = items[0].id;
        console.log("OCR Search: Navigating to individual item:", itemId);
        
        // Navigate to the individual item detail page
        navigate(`/inventory/items/${itemId}`);
        
        toast({
          title: "Individual Unit Found",
          description: `Navigating to unit with tool number: ${searchTerm}`,
        });
      } else {
        console.log("OCR Search: No individual units found, falling back to regular search");
        // No individual units found, fall back to regular product search
        setSearchQuery(searchTerm);
        toast({
          title: "No Individual Unit Found",
          description: `Searching products for: ${searchTerm}`,
        });
      }
    } catch (error) {
      console.error("Error searching for tool number:", error);
      // Fall back to regular search if there's an error
      setSearchQuery(searchTerm);
      toast({
        title: "Search Error",
        description: "There was an error searching. Falling back to product search.",
        variant: "destructive",
      });
    }
  };

  const handleSearchSubmit = async (searchTerm: string) => {
    console.log("Manual Search: handleSearchSubmit called with:", searchTerm);
    if (!searchTerm.trim()) {
      console.log("Manual Search: Empty search term, returning");
      return;
    }
    
    // Use the same logic as OCR search for consistency
    try {
      console.log("Manual Search: Searching product_items for tool number:", searchTerm);
      const { data: items, error } = await supabase
        .from("product_items")
        .select("product_id, tool_number, id")
        .ilike("tool_number", `%${searchTerm}%`)
        .limit(1);
        
      if (error) {
        console.error("Manual Search: Database error:", error);
        throw error;
      }
      
      console.log("Manual Search: Database response:", items);
      
      if (items && items.length > 0) {
        // Found an individual unit with this tool number - navigate directly to its page
        const itemId = items[0].id;
        console.log("Manual Search: Found individual item, navigating to:", itemId);
        
        // Navigate to the individual item detail page
        navigate(`/inventory/items/${itemId}`);
        
        toast({
          title: "Individual Unit Found",
          description: `Navigating to unit with tool number: ${searchTerm}`,
        });
      } else {
        // No individual units found, keep the search query for regular product search
        console.log("Manual Search: No individual units found, showing product results");
        toast({
          title: "No Individual Unit Found",
          description: `Showing product search results for: ${searchTerm}`,
        });
      }
    } catch (error) {
      console.error("Error searching for tool number:", error);
      toast({
        title: "Search Error",
        description: "There was an error searching. Showing product results.",
        variant: "destructive",
      });
    }
  };

  const filters = [
    { key: "all" as FilterType, label: "All Products" },
    { key: "in_stock" as FilterType, label: "In Stock" },
    { key: "low_stock" as FilterType, label: "Low Stock" },
    { key: "out_of_stock" as FilterType, label: "Out of Stock" },
    { key: "available_now" as FilterType, label: "Available Now", icon: SlidersHorizontal }
  ];

  if (selectedProduct) {
    return (
      <ProductDetail 
        productId={selectedProduct} 
        onBack={() => {
          setSelectedProduct(null);
          setToolNumberToFind(null);
        }}
        toolNumberToFind={toolNumberToFind}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6 font-inter">
      {/* Header */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 font-inter">Products</h1>
            <p className="text-base text-gray-600 font-inter mt-1">Browse your rental product catalog with real-time status tracking</p>
          </div>
          <Button 
            className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold"
            onClick={() => setAddInventoryModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Inventory
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Badge
              key={filter.key}
              variant="outline"
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 hover:shadow-md",
                getFilterStyle(filter.key)
              )}
              onClick={() => handleFilterClick(filter.key)}
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
                variant="ghost"
                size="sm"
                onClick={() => setViewType("grid")}
                className={cn(
                  "h-8",
                  viewType === "grid" ? "bg-blue-600 text-white hover:bg-blue-700" : ""
                )}
              >
                <LayoutGrid className="w-4 h-4" />
                Icons
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewType("list")}
                className={cn(
                  "h-8",
                  viewType === "list" ? "bg-blue-600 text-white hover:bg-blue-700" : ""
                )}
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

          {/* Search Bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search products by name, code, or tool number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                console.log("Search input key pressed:", e.key);
                if (e.key === 'Enter') {
                  console.log("Enter key detected, calling handleSearchSubmit with:", searchQuery);
                  handleSearchSubmit(searchQuery);
                }
              }}
              className="pl-10 w-full rounded-lg border-gray-300 focus:border-blue-400"
            />
          </div>
        </div>

        {/* Tabs & Search Action Buttons - Same Row */}
        <div className="flex items-center justify-between">
          {/* Tabs - Left Side */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-md"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Products
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:bg-white rounded-md"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Location Map
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:bg-white rounded-md"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              OCR Quality
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:bg-white rounded-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Offline Sync
            </Button>
          </div>

          {/* Search Action Buttons - Right Side */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowOCRSearch(true)}
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
              title="Search by photographing product code or tool number"
              size="sm"
            >
              <Camera className="w-4 h-4 mr-2" />
              Search Photo
            </Button>
            <Button 
              variant="outline" 
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
              size="sm"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Products Only (Tabs moved up) */}
      <div className="space-y-4">
        <ProductGrid 
          filter={activeFilter}
          viewType={viewType}
          hideInactive={hideInactive}
          searchQuery={searchQuery}
          selectedLocationId={selectedLocationId}
          onProductSelect={(productId) => {
            // If we have a matching individual item, go directly to that page
            if (matchingItemId) {
              navigate(`/inventory/items/${matchingItemId}`);
            } else {
              setSelectedProduct(productId);
            }
          }}
        />
      </div>

      {/* Location-Aware Available Now Slider */}
      <LocationAwareAvailableSlider 
        isOpen={isAvailableSliderOpen}
        onClose={() => setIsAvailableSliderOpen(false)}
      />

      {/* Add Inventory Modal */}
      <AddInventoryModal
        isOpen={addInventoryModalOpen}
        onClose={() => setAddInventoryModalOpen(false)}
      />

      {/* OCR Search Dialog */}
      <OCRSearchCapture
        open={showOCRSearch}
        onClose={() => setShowOCRSearch(false)}
        onSearchResult={handleOCRSearchResult}
      />
    </div>
  );
};

export default Inventory;