import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  productId: string;
}

export const EditMaintenanceModal: React.FC<EditMaintenanceModalProps> = ({
  isOpen,
  onClose,
  item,
  productId,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    maintenance_reason: "",
    maintenance_notes: "",
    expected_return_date: "",
    maintenance_priority: "normal" as "low" | "normal" | "high" | "critical",
  });

  useEffect(() => {
    if (item) {
      setFormData({
        maintenance_reason: item.maintenance_reason || "",
        maintenance_notes: item.maintenance_notes || "",
        expected_return_date: item.expected_return_date ? 
          new Date(item.expected_return_date).toISOString().split('T')[0] : "",
        maintenance_priority: item.maintenance_priority || "normal",
      });
    }
  }, [item]);

  const updateMaintenanceMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("product_items")
        .update({
          maintenance_reason: data.maintenance_reason,
          maintenance_notes: data.maintenance_notes,
          expected_return_date: data.expected_return_date || null,
          maintenance_priority: data.maintenance_priority,
        })
        .eq("id", item.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Maintenance details updated successfully");
      queryClient.invalidateQueries({ queryKey: ["maintenance-items", productId] });
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to update maintenance details");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMaintenanceMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Maintenance Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="item_code">Item Code</Label>
            <Input
              id="item_code"
              value={item?.item_code || ""}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="maintenance_reason">Maintenance Reason</Label>
            <Input
              id="maintenance_reason"
              value={formData.maintenance_reason}
              onChange={(e) => handleInputChange("maintenance_reason", e.target.value)}
              placeholder="Why is this item in maintenance?"
            />
          </div>

          <div>
            <Label htmlFor="maintenance_priority">Priority Level</Label>
            <Select 
              value={formData.maintenance_priority} 
              onValueChange={(value) => handleInputChange("maintenance_priority", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="expected_return_date">Expected Return Date</Label>
            <Input
              id="expected_return_date"
              type="date"
              value={formData.expected_return_date}
              onChange={(e) => handleInputChange("expected_return_date", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="maintenance_notes">Maintenance Notes</Label>
            <Textarea
              id="maintenance_notes"
              value={formData.maintenance_notes}
              onChange={(e) => handleInputChange("maintenance_notes", e.target.value)}
              placeholder="Additional notes about this maintenance..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMaintenanceMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateMaintenanceMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};