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
      <DialogContent className="sm:max-w-xl bg-white max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Filter by Equipment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
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

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pr-2">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => {
                  const isSelected = tempSelectedIds.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      className={`relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => handleToggle(product.id)}
                    >
                      {/* Checkbox in top-left corner */}
                      <div className="absolute top-2 left-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggle(product.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 mb-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-10 h-10 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Name */}
                      <div className="text-center text-sm font-medium text-gray-900 line-clamp-2">
                        {product.name}
                      </div>
                    </div>
                  );
                })}
              </div>
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
