import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddMaintenanceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemCode: string;
  productId: string;
}

export const AddMaintenanceUpdateModal: React.FC<AddMaintenanceUpdateModalProps> = ({
  isOpen,
  onClose,
  itemId,
  itemCode,
  productId,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    update_type: "progress" as "progress" | "repair" | "parts" | "inspection",
    description: "",
    labor_hours: "",
    labor_cost: "",
    parts_cost: "",
    parts_used: "",
    technician: "",
  });

  const addUpdateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await (supabase as any)
        .from("maintenance_updates")
        .insert({
          item_id: itemId,
          update_type: data.update_type,
          description: data.description,
          labor_hours: data.labor_hours ? parseFloat(data.labor_hours) : null,
          labor_cost: data.labor_cost ? parseFloat(data.labor_cost) : null,
          parts_cost: data.parts_cost ? parseFloat(data.parts_cost) : null,
          parts_used: data.parts_used || null,
          technician: data.technician || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Maintenance update added successfully");
      queryClient.invalidateQueries({ queryKey: ["maintenance-updates", itemId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-items", productId] });
      setFormData({
        update_type: "progress",
        description: "",
        labor_hours: "",
        labor_cost: "",
        parts_cost: "",
        parts_used: "",
        technician: "",
      });
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to add maintenance update");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      toast.error("Please provide a description");
      return;
    }
    addUpdateMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Maintenance Update</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="item_code">Item Code</Label>
            <Input
              id="item_code"
              value={itemCode}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="update_type">Update Type</Label>
            <Select 
              value={formData.update_type} 
              onValueChange={(value) => handleInputChange("update_type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="progress">Progress Update</SelectItem>
                <SelectItem value="repair">Repair Work</SelectItem>
                <SelectItem value="parts">Parts Replacement</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe what was done or the current status..."
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="technician">Technician</Label>
            <Input
              id="technician"
              value={formData.technician}
              onChange={(e) => handleInputChange("technician", e.target.value)}
              placeholder="Who performed this work?"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="labor_hours">Labor Hours</Label>
              <Input
                id="labor_hours"
                type="number"
                step="0.5"
                min="0"
                value={formData.labor_hours}
                onChange={(e) => handleInputChange("labor_hours", e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div>
              <Label htmlFor="labor_cost">Labor Cost ($)</Label>
              <Input
                id="labor_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.labor_cost}
                onChange={(e) => handleInputChange("labor_cost", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parts_cost">Parts Cost ($)</Label>
              <Input
                id="parts_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.parts_cost}
                onChange={(e) => handleInputChange("parts_cost", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="parts_used">Parts Used</Label>
              <Input
                id="parts_used"
                value={formData.parts_used}
                onChange={(e) => handleInputChange("parts_used", e.target.value)}
                placeholder="List parts used..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addUpdateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {addUpdateMutation.isPending ? "Adding..." : "Add Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};