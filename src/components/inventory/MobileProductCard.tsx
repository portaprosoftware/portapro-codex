import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useUnifiedStockManagement } from "@/hooks/useUnifiedStockManagement";
import { getProductTypeLabel, ProductType } from "@/lib/productTypes";

interface Product {
  id: string;
  name: string;
  manufacturer?: string;
  default_price_per_day: number;
  image_url?: string;
  stock_total: number;
  stock_in_service: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  product_type?: ProductType;
  product_variant?: string;
}

interface MobileProductCardProps {
  product: Product;
  onSelect: () => void;
  onEdit?: () => void;
  onChangeStatus?: () => void;
  onAssignSeries?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  selectedLocationId?: string;
  selectedLocationName?: string;
}

export const MobileProductCard: React.FC<MobileProductCardProps> = ({
  product,
  onSelect,
  onEdit,
  onChangeStatus,
  onAssignSeries,
  onDuplicate,
  onDelete,
  selectedLocationId,
  selectedLocationName
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Use unified stock management for accurate calculations
  const { stockData } = useUnifiedStockManagement(product.id);
  const availableCount = stockData?.unified_available || 0;

  // Determine availability status and styling
  const getAvailabilityBadge = () => {
    if (availableCount >= 5) {
      return {
        label: `${availableCount} Available`,
        className: "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold",
      };
    } else if (availableCount > 0) {
      return {
        label: `Low: ${availableCount}`,
        className: "bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold",
      };
    } else {
      return {
        label: "Out of Stock",
        className: "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold",
      };
    }
  };

  const availabilityBadge = getAvailabilityBadge();

  // Get border color based on stock status
  const getBorderColor = () => {
    if (availableCount >= 5) return "border-l-green-500";
    if (availableCount > 0) return "border-l-amber-500";
    return "border-l-red-500";
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm overflow-hidden border-l-4 transition-all hover:shadow-md cursor-pointer",
        getBorderColor()
      )}
      onClick={onSelect}
    >
      {/* Image Section with 16:9 aspect ratio */}
      <div className="relative aspect-video bg-gray-100">
        {product.image_url && !imageError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-gray-400 text-4xl font-bold">
              {product.name.charAt(0)}
            </div>
          </div>
        )}

        {/* Kebab Menu - Top Right of Image */}
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(); }}>
                View
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  Edit
                </DropdownMenuItem>
              )}
              {onChangeStatus && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onChangeStatus(); }}>
                  Change Status
                </DropdownMenuItem>
              )}
              {onAssignSeries && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAssignSeries(); }}>
                  Assign Series
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                  Duplicate
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-2">
        {/* Title - 2 lines max */}
        <h3 className="font-bold text-gray-900 text-base line-clamp-2 leading-tight min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Meta Chips Row */}
        <div className="flex flex-wrap gap-1.5">
          {/* Availability Badge */}
          <Badge className={cn("text-xs px-2 py-0.5", availabilityBadge.className)}>
            {availabilityBadge.label}
          </Badge>

          {/* Product Type Badge */}
          {product.product_type && (
            <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium">
              {getProductTypeLabel(product.product_type)}
              {product.product_variant && ` - ${product.product_variant}`}
            </Badge>
          )}

          {/* Location Badge if filtered */}
          {selectedLocationId && selectedLocationId !== "all" && selectedLocationName && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              📍 {selectedLocationName}
            </Badge>
          )}
        </div>

        {/* Price Line */}
        {product.default_price_per_day > 0 && (
          <div className="text-blue-600 font-semibold text-base">
            ${product.default_price_per_day}/day
          </div>
        )}

        {/* Optional Short Description (Manufacturer) */}
        {product.manufacturer && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            by {product.manufacturer}
          </p>
        )}
      </div>
    </div>
  );
};
