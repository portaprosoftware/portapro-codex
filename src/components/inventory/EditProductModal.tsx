import React, { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditProductModalProps {
  productId: string;
  onClose: () => void;
  onDeleted?: () => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({ productId, onClose, onDeleted }) => {
  const queryClient = useQueryClient();
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    default_price_per_day: 0,
    low_stock_threshold: 0
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  React.useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        default_price_per_day: product.default_price_per_day || 0,
        low_stock_threshold: product.low_stock_threshold || 0
      });
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: async (updateData: typeof formData) => {
      const { error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated successfully");
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to update product");
      console.error(error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      console.log("Starting product deletion for ID:", productId);
      
      // First, delete all related records to avoid foreign key constraints
      console.log("Deleting related stock adjustments...");
      const { error: stockAdjustmentError } = await supabase
        .from("stock_adjustments")
        .delete()
        .eq("product_id", productId);
      
      if (stockAdjustmentError) {
        console.error("Error deleting stock adjustments:", stockAdjustmentError);
        throw new Error(`Failed to delete related stock adjustments: ${stockAdjustmentError.message}`);
      }

      // Delete product location stock
      console.log("Deleting product location stock...");
      const { error: locationStockError } = await supabase
        .from("product_location_stock")
        .delete()
        .eq("product_id", productId);
      
      if (locationStockError) {
        console.error("Error deleting product location stock:", locationStockError);
        throw new Error(`Failed to delete product location stock: ${locationStockError.message}`);
      }

      // Delete product items
      console.log("Deleting product items...");
      const { error: itemsError } = await supabase
        .from("product_items")
        .delete()
        .eq("product_id", productId);
      
      if (itemsError) {
        console.error("Error deleting product items:", itemsError);
        throw new Error(`Failed to delete product items: ${itemsError.message}`);
      }

      // Finally, delete the product itself
      console.log("Deleting product...");
      const { error: productError } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      
      if (productError) {
        console.error("Error deleting product:", productError);
        throw new Error(`Failed to delete product: ${productError.message}`);
      }
      
      console.log("Product deletion completed successfully");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully");
      onDeleted?.();
      onClose();
    },
    onError: (error: any) => {
      console.error('Delete mutation error:', error);
      
      // Provide user-friendly error messages
      if (error.message?.includes("foreign key constraint")) {
        toast.error("Cannot delete product: It has related data that must be removed first");
      } else if (error.message?.includes("stock_adjustments")) {
        toast.error("Cannot delete product: It has stock adjustment records");
      } else {
        toast.error(`Failed to delete product: ${error.message || 'Unknown error'}`);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDelete = () => {
    if (deleteConfirmation.toLowerCase() === "delete") {
      deleteMutation.mutate();
      setDeleteConfirmation("");
      setShowDangerZone(false);
    } else {
      toast.error("Please type 'delete' to confirm");
    }
  };

  const canDelete = deleteConfirmation.toLowerCase() === "delete";

  if (isLoading || !product) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="p-6">Loading...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Product: {product.name}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter product description"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Default Price per Day ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.default_price_per_day}
                    onChange={(e) => handleInputChange("default_price_per_day", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold">Low Stock Threshold</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={(e) => handleInputChange("low_stock_threshold", parseInt(e.target.value) || 0)}
                    placeholder="5"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-red-700">
                  Deleting this product will permanently remove it and all associated inventory items. This action cannot be undone.
                </p>
                
                {!showDangerZone ? (
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={() => setShowDangerZone(true)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Product
                  </Button>
                ) : (
                  <div className="space-y-4 p-4 border border-red-300 rounded-lg bg-red-100">
                    <div className="space-y-2">
                      <Label htmlFor="delete-confirmation" className="text-red-800 font-medium">
                        Type "delete" to confirm deletion of "{product.name}"
                      </Label>
                      <Input
                        id="delete-confirmation"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="Type 'delete' to confirm"
                        className="border-red-300 focus:border-red-500"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setShowDangerZone(false);
                          setDeleteConfirmation("");
                        }}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!canDelete || deleteMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {deleteMutation.isPending ? "Deleting..." : "Delete Product"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};