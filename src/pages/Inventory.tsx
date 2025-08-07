import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { TabNav } from '@/components/ui/TabNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid3X3, List, QrCode, Camera, Plus, MapPin, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductsView } from '@/components/inventory/ProductsView';
import { LocationMapView } from '@/components/inventory/LocationMapView';
import { PanelScansView } from '@/components/inventory/PanelScansView';
import { CodeCategoriesView } from '@/components/inventory/CodeCategoriesView';
import { ProductDetail } from '@/components/inventory/ProductDetail';
import { AddInventoryModal } from '@/components/inventory/AddInventoryModal';
import { useToast } from '@/hooks/use-toast';

type FilterType = "all" | "in_stock" | "low_stock" | "out_of_stock" | "available_now";
type ViewType = "grid" | "list";

const Inventory: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'products' | 'location-map' | 'panel-scans' | 'code-categories'>('products');
  
  // State from original Inventory page
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [viewType, setViewType] = useState<ViewType>("list");
  const [hideInactive, setHideInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");
  const [addInventoryModalOpen, setAddInventoryModalOpen] = useState(false);
  const [showOCRSearch, setShowOCRSearch] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Set active tab based on URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/location-map')) {
      setActiveTab('location-map');
    } else if (path.includes('/panel-scans')) {
      setActiveTab('panel-scans');
    } else if (path.includes('/code-categories')) {
      setActiveTab('code-categories');
    } else {
      setActiveTab('products');
    }
  }, [location.pathname]);

  // Redirect /inventory to /inventory/products
  useEffect(() => {
    if (location.pathname === '/inventory') {
      navigate('/inventory/products', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Fetch count of inactive products (those with track_inventory = false)
  const { data: inactiveProductsCount = 0 } = useQuery({
    queryKey: ['inactive-products-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('track_inventory', false);
      
      if (error) throw error;
      return data?.length || 0;
    }
  });

  // Auto-search with debouncing
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        handleAutoSearch(searchQuery);
      }
    }, 500);

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
      } else {
        console.log("Auto Search: No individual items found");
      }
    } catch (error) {
      console.error("Auto search error:", error);
    }
  };

  const navigateToTab = (tabKey: string) => {
    navigate(`/inventory/${tabKey}`);
  };

  const handleFilterClick = (filterKey: FilterType) => {
    setActiveFilter(filterKey);
  };

  const getFilterStyle = (filterKey: FilterType) => {
    const isActive = activeFilter === filterKey;
    
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
    
    try {
      const { data: items, error } = await supabase
        .from("product_items")
        .select("product_id, tool_number, id")
        .ilike("tool_number", `%${searchTerm}%`)
        .limit(1);
        
      if (error) throw error;
      
      if (items && items.length > 0) {
        const itemId = items[0].id;
        navigate(`/inventory/items/${itemId}`);
        
        toast({
          title: "Individual Unit Found",
          description: `Navigating to unit with tool number: ${searchTerm}`,
        });
      } else {
        setSearchQuery(searchTerm);
        toast({
          title: "No Individual Unit Found",
          description: `Searching products for: ${searchTerm}`,
        });
      }
    } catch (error) {
      console.error("Error searching for tool number:", error);
      setSearchQuery(searchTerm);
      toast({
        title: "Search Error",
        description: "There was an error searching. Falling back to product search.",
        variant: "destructive",
      });
    }
  };

  const handleSearchSubmit = async () => {
    const searchTerm = searchQuery;
    if (!searchTerm.trim()) return;
    
    try {
      const { data: items, error } = await supabase
        .from("product_items")
        .select("product_id, tool_number, id")
        .ilike("tool_number", `%${searchTerm}%`)
        .limit(1);
        
      if (error) throw error;
      
      if (items && items.length > 0) {
        const itemId = items[0].id;
        navigate(`/inventory/items/${itemId}`);
        
        toast({
          title: "Individual Unit Found",
          description: `Navigating to unit with tool number: ${searchTerm}`,
        });
      } else {
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

  const handleQRScanResult = async (result: string) => {
    console.log("QR Scan: Starting search for:", result);
    setShowQRScanner(false);
    
    try {
      const { data: items, error } = await supabase
        .from("product_items")
        .select("product_id, tool_number, id")
        .ilike("tool_number", `%${result}%`)
        .limit(1);
        
      if (error) throw error;
      
      if (items && items.length > 0) {
        const itemId = items[0].id;
        navigate(`/inventory/items/${itemId}`);
        
        toast({
          title: "Individual Unit Found",
          description: `Navigating to unit with tool number: ${result}`,
        });
      } else {
        setSearchQuery(result);
        toast({
          title: "No Individual Unit Found",
          description: `Searching products for: ${result}`,
        });
      }
    } catch (error) {
      console.error("Error searching for QR code:", error);
      setSearchQuery(result);
      toast({
        title: "Search Error",
        description: "There was an error searching. Falling back to product search.",
        variant: "destructive",
      });
    }
  };

  const filters = [
    { key: "all" as FilterType, label: "All Items", count: null },
    { key: "available_now" as FilterType, label: "Available Now", count: null },
    { key: "in_stock" as FilterType, label: "In Stock", count: null },
    { key: "low_stock" as FilterType, label: "Low Stock", count: null },
    { key: "out_of_stock" as FilterType, label: "Out of Stock", count: null },
  ];

  if (selectedProduct) {
    return (
      <ProductDetail 
        productId={selectedProduct} 
        onBack={() => setSelectedProduct(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Inventory Management" 
        subtitle="Manage your portable toilet inventory and assets"
      />
      
      <div className="p-6 space-y-6">
        {/* Tab Navigation */}
        <TabNav ariaLabel="Inventory navigation">
          <TabNav.Item
            to="/inventory/products"
            isActive={activeTab === 'products'}
            onClick={() => navigateToTab('products')}
          >
            <Grid3X3 className="h-4 w-4" />
            Products
          </TabNav.Item>
          <TabNav.Item
            to="/inventory/location-map"
            isActive={activeTab === 'location-map'}
            onClick={() => navigateToTab('location-map')}
          >
            <MapPin className="h-4 w-4" />
            Location Map
          </TabNav.Item>
          <TabNav.Item
            to="/inventory/panel-scans"
            isActive={activeTab === 'panel-scans'}
            onClick={() => navigateToTab('panel-scans')}
          >
            <BarChart3 className="h-4 w-4" />
            Panel Scans
          </TabNav.Item>
          <TabNav.Item
            to="/inventory/code-categories"
            isActive={activeTab === 'code-categories'}
            onClick={() => navigateToTab('code-categories')}
          >
            <Settings className="h-4 w-4" />
            Code Categories
          </TabNav.Item>
        </TabNav>

        {/* Content based on active tab */}
        {activeTab === 'products' && (
          <>
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => handleFilterClick(filter.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                    getFilterStyle(filter.key)
                  )}
                >
                  {filter.label}
                  {filter.count !== null && (
                    <Badge variant="secondary" className="ml-2 text-xs bg-white/20">
                      {filter.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            {/* Location, View Controls, and Hide Inactive */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Location Selector */}
              <div className="flex-1 max-w-xs">
                <Label htmlFor="location-select" className="text-sm font-medium mb-2 block">Filter by Location</Label>
                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                  <SelectTrigger id="location-select" className="w-full">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="yard">Yard</SelectItem>
                    <SelectItem value="field">Field</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Toggle */}
              <div className="flex items-end gap-2">
                <Label className="text-sm font-medium">View</Label>
                <div className="flex bg-muted rounded-lg p-1">
                  <Button
                    variant={viewType === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewType('grid')}
                    className="h-8 px-3"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewType === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewType('list')}
                    className="h-8 px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Hide Inactive Switch */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="hide-inactive"
                  checked={hideInactive}
                  onCheckedChange={setHideInactive}
                />
                <Label htmlFor="hide-inactive" className="text-sm">Hide Inactive</Label>
              </div>
            </div>

            {/* Search Bar and Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by product name, item code, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit();
                    }
                  }}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setAddInventoryModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Inventory
                </Button>
              </div>
            </div>

            {/* Product Grid */}
            <ProductsView
              filter={activeFilter}
              viewType={viewType}
              hideInactive={hideInactive}
              searchQuery={searchQuery}
              selectedLocationId={selectedLocationId}
              onProductSelect={(productId) => setSelectedProduct(productId)}
            />
          </>
        )}

        {activeTab === 'location-map' && <LocationMapView />}

        {activeTab === 'panel-scans' && <PanelScansView />}

        {activeTab === 'code-categories' && <CodeCategoriesView />}

        {/* Modals */}
        <AddInventoryModal 
          isOpen={addInventoryModalOpen}
          onClose={() => setAddInventoryModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default Inventory;