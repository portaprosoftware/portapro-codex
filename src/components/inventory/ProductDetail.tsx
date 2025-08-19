import React, { useState, useEffect } from "react";
import { ArrowLeft, Home, ChevronRight, Settings, Plus, QrCode, Search, Filter, Edit, Trash, Palette, Building, Wrench, ShieldCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProductOverview } from "./ProductOverview";
import { IndividualUnitsTab } from "./IndividualUnitsTab";
import { ProductAttributesTab } from "./ProductAttributesTab";
import { ProductLocationStock } from "./ProductLocationStock";
import { IndividualItemCreation } from "./IndividualItemCreation";
import { MaintenanceTrackerTab } from "./MaintenanceTrackerTab";
import { ProductComplianceTab } from "./ProductComplianceTab";

interface ProductDetailProps {
  productId: string;
  onBack: () => void;
  toolNumberToFind?: string | null;
  initialTab?: string;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ productId, onBack, toolNumberToFind, initialTab }) => {
  // Prioritize units tab when returning from unit detail or when explicitly set
  const determineInitialTab = () => {
    if (initialTab) return initialTab;
    if (toolNumberToFind) return "units";
    return "overview";
  };
  
  const [activeTab, setActiveTab] = useState(determineInitialTab());
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  // Update active tab when props change
  useEffect(() => {
    const newTab = determineInitialTab();
    console.log("ProductDetail: Setting tab to:", newTab, { initialTab, toolNumberToFind });
    setActiveTab(newTab);
  }, [initialTab, toolNumberToFind]);
  
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch individual units count for this product
  const { data: individualUnitsCount } = useQuery({
    queryKey: ["individual-units-count", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_items")
        .select("id", { count: 'exact' })
        .eq("product_id", productId);
      
      if (error) throw error;
      return data?.length || 0;
    }
  });

  // Fetch maintenance items count for this product
  const { data: maintenanceCount } = useQuery({
    queryKey: ["maintenance-count", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_items")
        .select("id", { count: 'exact' })
        .eq("product_id", productId)
        .eq("status", "maintenance");
      
      if (error) throw error;
      return data?.length || 0;
    }
  });

  // Set up real-time updates for individual units count
  useEffect(() => {
    const channel = supabase
      .channel('individual-units-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_items',
          filter: `product_id=eq.${productId}`
        },
        () => {
          // Invalidate and refetch the count when items are added/removed/updated
          queryClient.invalidateQueries({ queryKey: ['individual-units-count', productId] });
          queryClient.invalidateQueries({ queryKey: ['maintenance-count', productId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, queryClient]);

  if (isLoading || !product) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Tab configuration
  const tabs = [
    {
      value: "overview",
      label: "Overview",
      icon: Settings,
      badge: null
    },
    {
      value: "locations",
      label: "Site Stock", 
      icon: Building,
      badge: null
    },
    {
      value: "units",
      label: "Tracked Units",
      icon: QrCode,
      badge: individualUnitsCount
    },
    {
      value: "compliance",
      label: "Compliance",
      icon: ShieldCheck,
      badge: null
    },
    {
      value: "maintenance",
      label: "Maintenance",
      icon: Wrench,
      badge: maintenanceCount && maintenanceCount > 0 ? maintenanceCount : null
    },
    {
      value: "attributes",
      label: "Variations",
      icon: Palette,
      badge: null
    }
  ];

  const activeTabData = tabs.find(tab => tab.value === activeTab);

  return (
    <div className="p-6 space-y-6 font-inter">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Button
          variant="ghost"
          onClick={onBack}
          className="px-3 py-2 h-auto bg-blue-600 text-white hover:bg-blue-700 rounded-md"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Inventory
        </Button>
        <Home className="w-4 h-4 text-gray-400" />
        <span className="text-gray-600">Home</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-gray-600">Inventory</span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-gray-900 font-medium">{product.name}</span>
      </div>

      {/* Gradient Pill Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Desktop/Tablet - 2x3 Grid of Gradient Pills */}
        <div className="hidden sm:block mb-6">
          <div className="grid grid-cols-3 gap-3 max-w-4xl">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.value;
              
              // Define gradient colors for each tab
              const getGradientClass = (value: string) => {
                switch (value) {
                  case 'overview':
                    return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700';
                  case 'locations':
                    return 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700';
                  case 'units':
                    return 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700';
                  case 'compliance':
                    return 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700';
                  case 'maintenance':
                    return 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700';
                  case 'attributes':
                    return 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700';
                  default:
                    return 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700';
                }
              };
              
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "flex items-center justify-center gap-3 px-6 py-4 rounded-full transition-all duration-200 text-white font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02]",
                    getGradientClass(tab.value),
                    isActive && "ring-2 ring-white ring-offset-2 shadow-xl scale-[1.02]"
                  )}
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-semibold">{tab.label}</span>
                  {tab.badge !== null && tab.badge !== undefined && (
                    <Badge className="ml-2 flex-shrink-0 bg-white/20 text-white border-white/30 text-xs px-2 py-1">
                      {tab.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Dropdown */}
        <div className="block sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between bg-white"
              >
                <div className="flex items-center gap-2">
                  {activeTabData && (
                    <>
                      <activeTabData.icon className="w-4 h-4" />
                      <span>{activeTabData.label}</span>
                      {activeTabData.badge !== null && activeTabData.badge !== undefined && (
                        <Badge className="ml-1 border-0 font-bold bg-gray-200 text-gray-800">
                          {activeTabData.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full bg-white border border-gray-200 shadow-lg z-50">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <DropdownMenuItem
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer px-4 py-2",
                      "hover:bg-gray-100 focus:bg-gray-100",
                      activeTab === tab.value && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.badge !== null && tab.badge !== undefined && (
                      <Badge className="ml-auto border-0 font-bold bg-gray-200 text-gray-800">
                        {tab.badge}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent value="overview" className="mt-6">
          <ProductOverview product={product} onDeleted={onBack} />
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <ProductLocationStock productId={productId} productName={product.name} />
        </TabsContent>

        <TabsContent value="units" className="mt-6">
          <IndividualUnitsTab productId={productId} toolNumberToFind={toolNumberToFind} />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <MaintenanceTrackerTab productId={productId} />
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <ProductComplianceTab productId={productId} productName={product.name} />
        </TabsContent>

        <TabsContent value="attributes" className="mt-6">
          <ProductAttributesTab productId={productId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};