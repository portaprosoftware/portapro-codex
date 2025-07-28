import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "./ProductCard";
import { ProductListItem } from "./ProductListItem";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridProps {
  filter: "all" | "in_stock" | "low_stock" | "out_of_stock" | "available_now";
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
  const { data: products, isLoading, error } = useQuery({
    queryKey: ["products", filter, hideInactive, searchQuery, selectedLocationId],
    queryFn: async () => {
      try {
        let query = supabase
          .from("products")
          .select(`
            *,
            product_items(count),
            product_location_stock(storage_location_id, quantity, storage_locations(id, name))
          `);

        if (hideInactive) {
          query = query.eq("track_inventory", true);
        }

        if (searchQuery) {
          // Search by product name OR if any product_items have matching tool_number
          query = query.or(`name.ilike.%${searchQuery}%,product_items.tool_number.ilike.%${searchQuery}%`);
        }

        // Filter by storage location if specified
        if (selectedLocationId && selectedLocationId !== "all") {
          query = query.eq("product_location_stock.storage_location_id", selectedLocationId);
        }

        const { data, error } = await query;
        if (error) {
          console.error("Database query error:", error);
          throw error;
        }

        if (!data) {
          console.warn("No data returned from products query");
          return [];
        }

        // Filter based on stock status and location with improved error handling
        return data.filter(product => {
          try {
            // Default to master stock, with fallback safety
            let availableCount = product.stock_total || 0;
            
            // Handle location-specific filtering
            if (selectedLocationId && selectedLocationId !== "all") {
              if (product.product_location_stock && Array.isArray(product.product_location_stock)) {
                const locationData = product.product_location_stock.find(
                  (ls: any) => ls?.storage_location_id === selectedLocationId
                );
                availableCount = locationData?.quantity || 0;
              } else {
                // No location stock data - exclude from location-specific view
                return false;
              }
            }
            
            const lowStockThreshold = product.low_stock_threshold || 5;
            const isLowStock = availableCount <= lowStockThreshold;
            const isOutOfStock = availableCount <= 0;

            switch (filter) {
              case "in_stock":
                return availableCount > 0;
              case "low_stock":
                return isLowStock && !isOutOfStock;
              case "out_of_stock":
                return isOutOfStock;
              case "available_now":
                return availableCount > 0 && !isLowStock;
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