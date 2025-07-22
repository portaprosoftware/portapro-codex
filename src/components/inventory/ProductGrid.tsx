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
  onProductSelect: (productId: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  filter,
  viewType,
  hideInactive,
  searchQuery,
  onProductSelect
}) => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", filter, hideInactive, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          *,
          product_items(count)
        `);

      if (hideInactive) {
        query = query.eq("track_inventory", true);
      }

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter based on stock status
      return data?.filter(product => {
        const availableCount = product.stock_total - product.stock_in_service;
        const isLowStock = availableCount <= product.low_stock_threshold;
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
      }) || [];
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

  if (!products?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products found matching your criteria.</p>
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