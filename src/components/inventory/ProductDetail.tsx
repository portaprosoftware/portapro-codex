import React, { useState, useEffect } from "react";
import { ArrowLeft, Home, ChevronRight, Settings, Plus, QrCode, Search, Filter, Edit, Trash, Palette, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ProductOverview } from "./ProductOverview";
import { IndividualUnitsTab } from "./IndividualUnitsTab";
import { ProductAttributesTab } from "./ProductAttributesTab";
import { ProductLocationStock } from "./ProductLocationStock";
import { IndividualItemCreation } from "./IndividualItemCreation";

interface ProductDetailProps {
  productId: string;
  onBack: () => void;
  toolNumberToFind?: string | null;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ productId, onBack, toolNumberToFind }) => {
  const [activeTab, setActiveTab] = useState(toolNumberToFind ? "units" : "overview");
  const queryClient = useQueryClient();
  
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Storage Site Stock
          </TabsTrigger>
          <TabsTrigger value="units" className="flex items-center gap-2 flex-wrap">
            <QrCode className="w-4 h-4 flex-shrink-0" />
            <span className="break-words">Individual Units</span>
            {individualUnitsCount !== undefined && (
              <Badge 
                className="ml-1 flex-shrink-0 border-0 font-bold bg-gray-200 text-gray-800"
              >
                {individualUnitsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="attributes" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Variations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <ProductOverview product={product} onDeleted={onBack} />
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <ProductLocationStock productId={productId} productName={product.name} />
        </TabsContent>

        <TabsContent value="units" className="mt-6">
          <IndividualUnitsTab productId={productId} toolNumberToFind={toolNumberToFind} />
        </TabsContent>

        <TabsContent value="attributes" className="mt-6">
          <ProductAttributesTab productId={productId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};