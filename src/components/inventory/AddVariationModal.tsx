import React, { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddVariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}

export const AddVariationModal: React.FC<AddVariationModalProps> = ({
  isOpen,
  onClose,
  productId,
}) => {
  const [variationName, setVariationName] = useState("");
  const [variationValues, setVariationValues] = useState<string[]>([]);
  const [currentValue, setCurrentValue] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const queryClient = useQueryClient();

  const addVariationMutation = useMutation({
    mutationFn: async () => {
      if (!variationName.trim()) {
        throw new Error("Variation name is required");
      }
      if (variationValues.length === 0) {
        throw new Error("At least one variation value is required");
      }

      // Insert each variation value as a separate row
      const variationData = variationValues.map(value => ({
        product_id: productId,
        attribute_name: variationName.trim(),
        attribute_value: value.trim(),
        is_required: isRequired,
      }));

      const { error } = await supabase
        .from('product_properties')
        .insert(variationData);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Variation added successfully");
      queryClient.invalidateQueries({ queryKey: ['product-attributes', productId] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(`Failed to add variation: ${error.message}`);
    },
  });

  const handleClose = () => {
    setVariationName("");
    setVariationValues([]);
    setCurrentValue("");
    setIsRequired(false);
    onClose();
  };

  const handleAddValue = () => {
    const trimmedValue = currentValue.trim();
    if (trimmedValue && !variationValues.includes(trimmedValue)) {
      setVariationValues(prev => [...prev, trimmedValue]);
      setCurrentValue("");
    }
  };

  const handleRemoveValue = (valueToRemove: string) => {
    setVariationValues(prev => prev.filter(value => value !== valueToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddValue();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Add Product Variation</DialogTitle>
          <DialogDescription>
            Create a new variation type that can be applied to individual items of this product.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Variation Name */}
          <div className="space-y-2">
            <Label htmlFor="variation-name">Variation Name</Label>
            <Input
              id="variation-name"
              placeholder="e.g., Color, Size, Condition"
              value={variationName}
              onChange={(e) => setVariationName(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Variation Values */}
          <div className="space-y-2">
            <Label htmlFor="variation-value">Variation Values</Label>
            <div className="flex gap-2">
              <Input
                id="variation-value"
                placeholder="e.g., Blue, Red, Green"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onKeyPress={handleKeyPress}
                autoComplete="off"
              />
              <Button
                type="button"
                onClick={handleAddValue}
                disabled={!currentValue.trim()}
                className="flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Display added values */}
            {variationValues.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {variationValues.map((value, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="flex items-center gap-1 bg-gray-50 text-gray-700 border-gray-200"
                  >
                    {value}
                    <button
                      onClick={() => handleRemoveValue(value)}
                      className="ml-1 text-gray-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Required Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="is-required">Required Variation</Label>
              <p className="text-sm text-gray-500">
                Required variations must be set for each individual item
              </p>
            </div>
            <Switch
              id="is-required"
              checked={isRequired}
              onCheckedChange={setIsRequired}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => addVariationMutation.mutate()}
            disabled={addVariationMutation.isPending || !variationName.trim() || variationValues.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {addVariationMutation.isPending ? "Adding..." : "Add Variation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};