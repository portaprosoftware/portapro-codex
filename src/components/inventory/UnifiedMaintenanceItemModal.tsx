import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, DollarSign, MapPin, Settings, Wrench } from "lucide-react";

interface StorageLocation { id: string; name: string }

interface UnifiedMaintenanceItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  productId: string;
  storageLocations: StorageLocation[] | undefined;
}

interface MaintenanceUpdateForm {
  update_type: "progress" | "repair" | "parts" | "inspection";
  description: string;
  labor_hours: string;
  labor_cost: string;
  parts_cost: string;
  parts_used: string;
  technician: string;
}

export const UnifiedMaintenanceItemModal: React.FC<UnifiedMaintenanceItemModalProps> = ({
  isOpen,
  onClose,
  item,
  productId,
  storageLocations,
}) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    maintenance_reason: "",
    maintenance_notes: "",
    expected_return_date: "",
    maintenance_priority: "normal" as "low" | "normal" | "high" | "critical",
    current_storage_location_id: "" as string | null,
    tool_number: "",
    vendor_id: "",
    condition: "",
  });

  useEffect(() => {
    if (item) {
      setFormData({
        maintenance_reason: item.maintenance_reason || "",
        maintenance_notes: item.maintenance_notes || "",
        expected_return_date: item.expected_return_date
          ? new Date(item.expected_return_date).toISOString().split("T")[0]
          : "",
        maintenance_priority: item.maintenance_priority || "normal",
        current_storage_location_id: item.current_storage_location_id || "",
        tool_number: item.tool_number || "",
        vendor_id: item.vendor_id || "",
        condition: item.condition || "",
      });
    }
  }, [item]);

  // Fetch maintenance updates for summary and timeline
  const itemId = item?.id as string | undefined;
  const { data: updates } = useQuery({
    queryKey: ["maintenance-updates", itemId],
    enabled: !!itemId && isOpen,
    queryFn: async () => {
      if (!itemId) return [] as any[];
      const { data, error } = await (supabase as any)
        .from("maintenance_updates")
        .select("*")
        .eq("item_id", itemId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const totalCost = useMemo(() => {
    return (updates || []).reduce((sum: number, u: any) => sum + (u.labor_cost || 0) + (u.parts_cost || 0), 0);
  }, [updates]);

  const updateItemMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("product_items")
        .update({
          maintenance_reason: data.maintenance_reason,
          maintenance_notes: data.maintenance_notes,
          expected_return_date: data.expected_return_date || null,
          maintenance_priority: data.maintenance_priority,
          current_storage_location_id: data.current_storage_location_id || null,
          tool_number: data.tool_number || null,
          vendor_id: data.vendor_id || null,
          condition: data.condition || null,
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item updated");
      queryClient.invalidateQueries({ queryKey: ["maintenance-items", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-items", productId] });
      onClose();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to update item");
    },
  });

  const [updateForm, setUpdateForm] = useState<MaintenanceUpdateForm>({
    update_type: "progress",
    description: "",
    labor_hours: "",
    labor_cost: "",
    parts_cost: "",
    parts_used: "",
    technician: "",
  });

  const addUpdateMutation = useMutation({
    mutationFn: async (data: MaintenanceUpdateForm) => {
      if (!itemId) return;
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
      toast.success("Update added");
      queryClient.invalidateQueries({ queryKey: ["maintenance-updates", itemId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-items", productId] });
      setUpdateForm({
        update_type: "progress",
        description: "",
        labor_hours: "",
        labor_cost: "",
        parts_cost: "",
        parts_used: "",
        technician: "",
      });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to add update");
    },
  });

  const handleItemSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateItemMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Unit • {item?.item_code}</DialogTitle>
          <DialogDescription className="sr-only">Manage maintenance item details, location, and updates</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 bg-white border rounded-lg p-3">
              <Wrench className="w-4 h-4" />
              <div>
                <div className="text-xs text-muted-foreground">Reason</div>
                <div className="text-sm font-medium">{formData.maintenance_reason || "—"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white border rounded-lg p-3">
              <Clock className="w-4 h-4" />
              <div>
                <div className="text-xs text-muted-foreground">Expected Return</div>
                <div className="text-sm font-medium">{formData.expected_return_date || "—"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white border rounded-lg p-3">
              <DollarSign className="w-4 h-4" />
              <div>
                <div className="text-xs text-muted-foreground">Total Cost</div>
                <div className="text-sm font-medium">${totalCost.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Edit form */}
          <form onSubmit={handleItemSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Maintenance Details */}
              <div className="bg-white border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4" />
                  <h4 className="font-medium">Maintenance Details</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Reason</Label>
                    <Input
                      value={formData.maintenance_reason}
                      onChange={(e) => setFormData((p) => ({ ...p, maintenance_reason: e.target.value }))}
                      placeholder="Why is this item in maintenance?"
                    />
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={formData.maintenance_priority}
                      onValueChange={(v) => setFormData((p) => ({ ...p, maintenance_priority: v as any }))}
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
                    <Label>Expected Return</Label>
                    <Input
                      type="date"
                      value={formData.expected_return_date}
                      onChange={(e) => setFormData((p) => ({ ...p, expected_return_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      rows={3}
                      value={formData.maintenance_notes}
                      onChange={(e) => setFormData((p) => ({ ...p, maintenance_notes: e.target.value }))}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
              </div>

              {/* Location & Item Details */}
              <div className="space-y-5">
                <div className="bg-white border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4" />
                    <h4 className="font-medium">Location Info</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label>Storage Location</Label>
                      <Select
                        value={formData.current_storage_location_id || ""}
                        onValueChange={(v) => setFormData((p) => ({ ...p, current_storage_location_id: v || null }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a storage location" />
                        </SelectTrigger>
                        <SelectContent>
                          {(storageLocations || []).map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4" />
                    <h4 className="font-medium">Unit Details</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Tool Number</Label>
                      <Input
                        value={formData.tool_number || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, tool_number: e.target.value }))}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <Label>Vendor ID</Label>
                      <Input
                        value={formData.vendor_id || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, vendor_id: e.target.value }))}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Condition</Label>
                      <Select
                        value={formData.condition || ""}
                        onValueChange={(v) => setFormData((p) => ({ ...p, condition: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="needs_repair">Needs Repair</SelectItem>
                          <SelectItem value="damaged">Damaged</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save controls */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={updateItemMutation.isPending}>
                {updateItemMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>

          <Separator />

          {/* Inline Add Update & history */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border rounded-xl p-4">
              <h4 className="font-medium mb-3">Add Maintenance Update</h4>
              <div className="space-y-3">
                <div>
                  <Label>Update Type</Label>
                  <Select
                    value={updateForm.update_type}
                    onValueChange={(v) => setUpdateForm((p) => ({ ...p, update_type: v as any }))}
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
                  <Label>Description *</Label>
                  <Textarea
                    rows={3}
                    value={updateForm.description}
                    onChange={(e) => setUpdateForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Describe what was done or current status"
                  />
                </div>
                <div>
                  <Label>Technician</Label>
                  <Input
                    value={updateForm.technician}
                    onChange={(e) => setUpdateForm((p) => ({ ...p, technician: e.target.value }))}
                    placeholder="Who performed this work?"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Labor Hours</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={updateForm.labor_hours}
                      onChange={(e) => setUpdateForm((p) => ({ ...p, labor_hours: e.target.value }))}
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <Label>Labor Cost ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={updateForm.labor_cost}
                      onChange={(e) => setUpdateForm((p) => ({ ...p, labor_cost: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Parts Cost ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={updateForm.parts_cost}
                      onChange={(e) => setUpdateForm((p) => ({ ...p, parts_cost: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Parts Used</Label>
                    <Input
                      value={updateForm.parts_used}
                      onChange={(e) => setUpdateForm((p) => ({ ...p, parts_used: e.target.value }))}
                      placeholder="List parts used"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      if (!updateForm.description.trim()) {
                        toast.error("Please provide a description");
                        return;
                      }
                      addUpdateMutation.mutate(updateForm);
                    }}
                    disabled={addUpdateMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {addUpdateMutation.isPending ? "Adding..." : "Add Update"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <h4 className="font-medium mb-3">Recent Updates</h4>
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {(updates || []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">No updates yet.</div>
                ) : (
                  (updates || []).map((u: any) => (
                    <div key={u.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="capitalize">{u.update_type}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-sm mb-2">{u.description}</div>
                      {(u.labor_hours || u.labor_cost || u.parts_cost || u.parts_used) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                          {u.labor_hours && <div>Labor: {u.labor_hours}h</div>}
                          {u.labor_cost && <div>Labor Cost: ${Number(u.labor_cost).toFixed(2)}</div>}
                          {u.parts_cost && <div>Parts Cost: ${Number(u.parts_cost).toFixed(2)}</div>}
                          {u.parts_used && <div className="md:col-span-2">Parts Used: {u.parts_used}</div>}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
