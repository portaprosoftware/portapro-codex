import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  image_url?: string | null;
}

interface EquipmentFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedProductIds: string[];
  onApplyFilters: (productIds: string[]) => void;
}

export const EquipmentFilterModal: React.FC<EquipmentFilterModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedProductIds,
  onApplyFilters,
}) => {
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedProductIds);
  const [searchTerm, setSearchTerm] = useState("");

  // Reset temp selection when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTempSelectedIds(selectedProductIds);
      setSearchTerm("");
    }
  }, [isOpen, selectedProductIds]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleToggle = (productId: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (tempSelectedIds.length === products.length) {
      setTempSelectedIds([]);
    } else {
      setTempSelectedIds(products.map((p) => p.id));
    }
  };

  const handleApply = () => {
    onApplyFilters(tempSelectedIds);
    onClose();
  };

  const handleClear = () => {
    setTempSelectedIds([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Filter by Equipment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>

          {/* Selection Summary */}
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {tempSelectedIds.length} of {products.length} selected
              </span>
              {tempSelectedIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-6 px-2 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="h-7 text-xs"
            >
              {tempSelectedIds.length === products.length ? "Deselect All" : "Select All"}
            </Button>
          </div>

          {/* Products List */}
          <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200 transition-colors"
                  onClick={() => handleToggle(product.id)}
                >
                  <Checkbox
                    checked={tempSelectedIds.includes(product.id)}
                    onCheckedChange={() => handleToggle(product.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <label className="flex-1 cursor-pointer font-medium text-gray-900">
                    {product.name}
                  </label>
                  {tempSelectedIds.includes(product.id) && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      Selected
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No products found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700 text-white">
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
