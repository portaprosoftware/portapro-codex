import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeleteVariationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  variationName: string | null;
}

export const DeleteVariationDialog: React.FC<DeleteVariationDialogProps> = ({
  isOpen,
  onClose,
  productId,
  variationName,
}) => {
  const queryClient = useQueryClient();

  const deleteVariationMutation = useMutation({
    mutationFn: async () => {
      if (!variationName) return;

      const { error } = await supabase
        .from('product_properties')
        .delete()
        .eq('product_id', productId)
        .eq('attribute_name', variationName);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Variation deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['product-attributes', productId] });
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete variation: ${error.message}`);
    },
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Delete Variation
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the variation "{variationName}"? 
            This action cannot be undone and will remove all values associated with this variation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteVariationMutation.mutate()}
            disabled={deleteVariationMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteVariationMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};