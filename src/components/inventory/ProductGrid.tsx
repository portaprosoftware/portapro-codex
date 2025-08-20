import React, { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "./ProductCard";
import { ProductListItem } from "./ProductListItem";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridProps {
  filter: "all" | "in_stock" | "low_stock" | "out_of_stock";
  viewType: "grid" | "list";
  hideInactive: boolean;
  searchQuery: string;
  selectedLocationId?: string;
  onProductSelect: (productId: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  filter,
  viewType,
  hideInactive,
  searchQuery,
  selectedLocationId = "all",
  onProductSelect
}) => {
  const queryClient = useQueryClient();

  // Set up real-time subscription for product_items changes
  useEffect(() => {
    console.log("ProductGrid: Setting up real-time subscription for product_items");
    const channel = supabase
      .channel('product-items-inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_items'
        },
        (payload) => {
          console.log("ProductGrid: Product items change detected:", payload);
          // Invalidate all product-related queries to refresh counts
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["product-stats"] });
          queryClient.invalidateQueries({ queryKey: ["individual-units-count"] });
        }
      )
      .subscribe();

    return () => {
      console.log("ProductGrid: Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  const { data: products, isLoading, error } = useQuery({
    queryKey: ["products", filter, hideInactive, searchQuery, selectedLocationId],
    queryFn: async () => {
      try {
        let data = [];
        
        // First, get products that match by name
        let nameQuery = supabase
          .from("products")
          .select(`
            *,
            product_items(*),
            product_location_stock(storage_location_id, quantity, storage_locations(id, name))
          `);

        if (hideInactive) {
          nameQuery = nameQuery.eq("track_inventory", true);
        }

        if (searchQuery) {
          nameQuery = nameQuery.or(`name.ilike.%${searchQuery}%,manufacturer.ilike.%${searchQuery}%`);
        }

        // Don't filter by location at query level - do it after retrieval
        // This allows "All Sites" to work and prevents empty results

        const { data: nameResults, error: nameError } = await nameQuery;
        if (nameError) throw nameError;
        
        if (nameResults) {
          data = [...nameResults];
        }

        // If we have a search query, also search individual product items by tool number
        if (searchQuery) {
          // Get product IDs that have matching tool numbers in their items
          const { data: itemResults, error: itemError } = await supabase
            .from("product_items")
            .select("product_id")
            .ilike("tool_number", `%${searchQuery}%`);
            
          if (itemError) throw itemError;
          
          if (itemResults && itemResults.length > 0) {
            const productIds = itemResults.map(item => item.product_id);
            
            // Get full product data for products that have matching tool numbers
            let toolQuery = supabase
              .from("products")
              .select(`
                *,
                product_items(*),
                product_location_stock(storage_location_id, quantity, storage_locations(id, name))
              `)
              .in("id", productIds);

            if (hideInactive) {
              toolQuery = toolQuery.eq("track_inventory", true);
            }

            // Don't filter by location at query level - do it after retrieval
            // This allows "All Sites" to work and prevents empty results

            const { data: toolResults, error: toolError } = await toolQuery;
            if (toolError) throw toolError;
            
            if (toolResults) {
              // Merge results, avoiding duplicates
              const existingIds = new Set(data.map(p => p.id));
              const newResults = toolResults.filter(p => !existingIds.has(p.id));
              data = [...data, ...newResults];
            }
          }
        }

        if (!data) {
          console.warn("No data returned from products query");
          return [];
        }

        // Filter based on stock status and location with improved error handling
        return data.filter(product => {
          try {
            // Calculate available stock: total - in_service
            let totalStock = product.stock_total || 0;
            let inService = product.stock_in_service || 0;
            let availableCount = Math.max(0, totalStock - inService);
            
            // Handle location-specific filtering
            if (selectedLocationId && selectedLocationId !== "all") {
              if (product.product_location_stock && Array.isArray(product.product_location_stock)) {
                const locationData = product.product_location_stock.find(
                  (ls: any) => ls?.storage_location_id === selectedLocationId
                );
                if (locationData) {
                  // For location-specific view, use the location quantity directly
                  availableCount = locationData.quantity || 0;
                } else {
                  // Product exists but no stock at this location - show with 0 count
                  availableCount = 0;
                }
              } else {
                // No location stock data - show product but with 0 count for location-specific view
                availableCount = 0;
              }
            }
            
            const lowStockThreshold = product.low_stock_threshold || 5;
            const isLowStock = availableCount <= lowStockThreshold && availableCount > 0;
            const isOutOfStock = availableCount <= 0;

            switch (filter) {
              case "in_stock":
                return availableCount > 0;
              case "low_stock":
                return isLowStock && !isOutOfStock;
              case "out_of_stock":
                return isOutOfStock;
              default:
                return true;
            }
          } catch (productError) {
            console.error("Error processing product:", product.id, productError);
            return false; // Exclude problematic products from results
          }
        }).sort((a, b) => a.name.localeCompare(b.name));
      } catch (queryError) {
        console.error("Products query failed:", queryError);
        throw queryError;
      }
    }
  });

  if (isLoading) {
    return (
      <div className={viewType === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className={viewType === "grid" ? "h-64" : "h-20"} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-2">Error loading products</p>
        <p className="text-gray-500 text-sm">Please try refreshing the page</p>
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products found matching your criteria.</p>
        {selectedLocationId && selectedLocationId !== "all" && (
          <p className="text-gray-400 text-sm mt-2">
            Try selecting "All Locations" to see products without location assignments
          </p>
        )}
      </div>
    );
  }

  if (viewType === "list") {
    return (
      <div className="space-y-2">
        {products.map((product) => (
          <ProductListItem
            key={product.id}
            product={product}
            onSelect={() => onProductSelect(product.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={() => onProductSelect(product.id)}
        />
      ))}
    </div>
  );
};