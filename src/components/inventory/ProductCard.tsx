import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ProductCardProps {
  product: Product;
  onSelect: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
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
        <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0">
          <span className="w-2 h-2 bg-white rounded-full mr-1"></span>
          Out of stock
        </Badge>
      );
    }

    if (isLowStock) {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold border-0">
          <span className="w-2 h-2 bg-white rounded-full mr-1"></span>
          Low Stock
        </Badge>
      );
    }

    return (
      <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0">
        <span className="w-2 h-2 bg-white rounded-full mr-1"></span>
        {availableCount}/{product.stock_total}
      </Badge>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition-all duration-200 group">
      {/* Top Right Stats Icon */}
      <div className="flex justify-end mb-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            // Handle stats view
          }}
        >
          <BarChart3 className="w-4 h-4 text-gray-400" />
        </Button>
      </div>

      {/* Product Image */}
      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          {product.base_image ? (
            <img
              src={product.base_image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-300 rounded"></div>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="text-center space-y-2">
        <h3 className="font-bold text-gray-900 text-sm leading-tight">{product.name}</h3>
        <p className="text-blue-600 font-semibold">${product.default_price_per_day}/day</p>
        
        {/* Status Badge */}
        <div className="flex justify-center">
          {getStatusBadge()}
        </div>
      </div>

      {/* View Button */}
      <div className="mt-4">
        <Button
          onClick={onSelect}
          variant="ocean"
          className="w-full"
        >
          <Eye className="w-4 h-4 mr-2" />
          View
        </Button>
      </div>
    </div>
  );
};