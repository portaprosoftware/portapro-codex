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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Desktop/Tablet Tabs */}
        <TabsList className={cn(
          "grid w-full",
          "hidden sm:grid",
          "grid-cols-6 lg:grid-cols-6 md:grid-cols-3"
        )}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                className="flex items-center gap-2 flex-wrap"
              >
                <IconComponent className="w-4 h-4 flex-shrink-0" />
                <span className="break-words">{tab.label}</span>
                {tab.badge !== null && tab.badge !== undefined && (
                  <Badge className="ml-1 flex-shrink-0 border-0 font-bold bg-gray-200 text-gray-800">
                    {tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

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