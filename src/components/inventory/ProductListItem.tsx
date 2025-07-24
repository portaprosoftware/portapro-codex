import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

interface Product {
  id: string;
  name: string;
  default_price_per_day: number;
  base_image?: string;
  stock_total: number;
  stock_in_service: number;
  low_stock_threshold: number;
  track_inventory: boolean;
}

interface ProductListItemProps {
  product: Product;
  onSelect: () => void;
}

export const ProductListItem: React.FC<ProductListItemProps> = ({ product, onSelect }) => {
  const availableCount = product.stock_total - product.stock_in_service;
  const isLowStock = availableCount <= product.low_stock_threshold;
  const isOutOfStock = availableCount <= 0;

  const getStatusBadge = () => {
    if (!product.track_inventory) {
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-300">
          Not tracked
        </Badge>
      );
    }

    if (isOutOfStock) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
          Out of stock
        </Badge>
      );
    }

    if (isLowStock) {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          <span className="w-2 h-2 bg-amber-500 rounded-full mr-1"></span>
          Low Stock
        </Badge>
      );
    }

    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
        {availableCount}/{product.stock_total}
      </Badge>
    );
  };

  return (
    <div className="flex items-center p-4 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
      {/* Product Image */}
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden mr-4">
        {product.base_image ? (
          <img
            src={product.base_image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-300 rounded"></div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{product.name}</h3>
        <p className="text-blue-600 font-medium">${product.default_price_per_day}/day</p>
      </div>

      {/* Status */}
      <div className="mr-4">
        {getStatusBadge()}
      </div>

      {/* Action */}
      <Button
        onClick={onSelect}
        variant="ocean"
        size="sm"
      >
        <Eye className="w-4 h-4 mr-1" />
        View
      </Button>
    </div>
  );
};