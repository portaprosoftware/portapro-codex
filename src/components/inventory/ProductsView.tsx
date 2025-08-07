import React from 'react';
import { ProductGrid } from './ProductGrid';

interface ProductsViewProps {
  filter: "all" | "in_stock" | "low_stock" | "out_of_stock" | "available_now";
  viewType: "grid" | "list";
  hideInactive: boolean;
  searchQuery: string;
  selectedLocationId: string;
  onProductSelect: (productId: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  filter,
  viewType,
  hideInactive,
  searchQuery,
  selectedLocationId,
  onProductSelect,
}) => {
  return (
    <ProductGrid
      filter={filter}
      viewType={viewType}
      hideInactive={hideInactive}
      searchQuery={searchQuery}
      selectedLocationId={selectedLocationId}
      onProductSelect={onProductSelect}
    />
  );
};