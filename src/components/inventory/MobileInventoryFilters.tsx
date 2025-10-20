import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Filter, ChevronDown, ChevronUp, Camera, QrCode, Sliders } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MobileInventoryFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedLocationId: string;
  onLocationChange: (value: string) => void;
  selectedProductType: string;
  onProductTypeChange: (value: string) => void;
  hideInactive: boolean;
  onHideInactiveChange: (value: boolean) => void;
  onCapturePanel?: () => void;
  onScanQR?: () => void;
  onAllUnits?: () => void;
}

export const MobileInventoryFilters: React.FC<MobileInventoryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedLocationId,
  onLocationChange,
  selectedProductType,
  onProductTypeChange,
  hideInactive,
  onHideInactiveChange,
  onCapturePanel,
  onScanQR,
  onAllUnits,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch storage locations
  const { data: locations } = useQuery({
    queryKey: ['storage-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch product types
  const { data: productTypes } = useQuery({
    queryKey: ['product-types-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('product_type')
        .not('product_type', 'is', null);
      
      if (error) throw error;
      
      // Get unique product types
      const uniqueTypes = [...new Set(data?.map(p => p.product_type).filter(Boolean))];
      return uniqueTypes;
    }
  });

  // Count active filters
  const activeFilterCount = [
    selectedLocationId !== "all",
    selectedProductType !== "all",
    hideInactive,
    searchQuery.trim() !== ""
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Collapsible Filter Panel */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-11"
          >
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-5 px-2 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </span>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-3 pt-3">
          {/* Search Input */}
          <div>
            <Input
              type="text"
              placeholder="Search unit code, product name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-11 text-base"
            />
          </div>

          {/* Site Selector */}
          <div>
            <Select value={selectedLocationId} onValueChange={onLocationChange}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {locations?.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Type Selector */}
          <div>
            <Select value={selectedProductType} onValueChange={onProductTypeChange}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="All Product Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Product Types</SelectItem>
                {productTypes?.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hide Inactive Toggle */}
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="hide-inactive-mobile" className="text-sm font-medium">
              Hide Inactive
            </Label>
            <Switch
              id="hide-inactive-mobile"
              checked={hideInactive}
              onCheckedChange={onHideInactiveChange}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Action Chips Row */}
      <div className="flex flex-wrap gap-2">
        {onCapturePanel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCapturePanel}
            className="flex-1 min-w-0 h-11"
          >
            <Camera className="h-4 w-4 mr-2" />
            <span className="truncate">Capture Panel</span>
          </Button>
        )}
        {onScanQR && (
          <Button
            variant="outline"
            size="sm"
            onClick={onScanQR}
            className="flex-1 min-w-0 h-11"
          >
            <QrCode className="h-4 w-4 mr-2" />
            <span className="truncate">Scan QR</span>
          </Button>
        )}
        {onAllUnits && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAllUnits}
            className="flex-1 min-w-0 h-11"
          >
            <Sliders className="h-4 w-4 mr-2 rotate-90" />
            <span className="truncate">Quick View</span>
          </Button>
        )}
      </div>

      {/* Explanatory Text */}
      <p className="text-xs text-muted-foreground px-1">
        Scan QR or snap a photo of the molded tool number to search
      </p>
    </div>
  );
};
