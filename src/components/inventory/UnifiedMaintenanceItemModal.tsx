import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, DollarSign, MapPin, Settings, Wrench, Trash2 } from "lucide-react";

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
  title: string;
  description: string;
  labor_hours: string;
  labor_cost: string;
  parts_cost: string;
  parts_used: string;
  technician_name: string;
}

export const UnifiedMaintenanceItemModal: React.FC<UnifiedMaintenanceItemModalProps> = ({
  isOpen,
  onClose,
  item,
  productId,
  storageLocations,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");

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
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  const totalCost = useMemo(() => {
    return (updates || []).reduce((sum: number, u: any) => sum + (u.cost_amount || 0), 0);
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
    title: "",
    description: "",
    labor_hours: "",
    labor_cost: "",
    parts_cost: "",
    parts_used: "",
    technician_name: "",
  });

  const addUpdateMutation = useMutation({
    mutationFn: async (data: MaintenanceUpdateForm) => {
      if (!itemId) return;
      
      // Calculate total cost from labor + parts
      const laborCost = data.labor_cost ? parseFloat(data.labor_cost) : 0;
      const partsCost = data.parts_cost ? parseFloat(data.parts_cost) : 0;
      const totalCost = laborCost + partsCost;
      
      // Convert parts_used string to JSONB array
      const partsUsedArray = data.parts_used ? 
        data.parts_used.split(',').map(part => part.trim()).filter(part => part) : 
        [];
      
      const { error } = await (supabase as any)
        .from("maintenance_updates")
        .insert({
          item_id: itemId,
          update_type: data.update_type,
          title: data.title,
          description: data.description,
          labor_hours: data.labor_hours ? parseFloat(data.labor_hours) : 0,
          cost_amount: totalCost,
          parts_used: partsUsedArray,
          technician_name: data.technician_name || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Update added");
      queryClient.invalidateQueries({ queryKey: ["maintenance-updates", itemId] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-items", productId] });
      setUpdateForm({
        update_type: "progress",
        title: "",
        description: "",
        labor_hours: "",
        labor_cost: "",
        parts_cost: "",
        parts_used: "",
        technician_name: "",
      });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to add update");
    },
  });

  // Delete update mutation
  const deleteUpdateMutation = useMutation({
    mutationFn: async (updateId: string) => {
      const { error } = await supabase
        .from("maintenance_updates")
        .delete()
        .eq("id", updateId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Maintenance update deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["maintenance-updates", itemId] });
    },
    onError: (error) => {
      console.error("Error deleting maintenance update:", error);
      toast.error("Failed to delete maintenance update");
    },
  });

  const handleDeleteUpdate = (updateId: string) => {
    deleteUpdateMutation.mutate(updateId);
  };

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

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Unit Details</TabsTrigger>
              <TabsTrigger value="update">Add / View Progress Updates</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
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
                      <Label>Tool Number (Reference)</Label>
                      <Input
                        value={formData.tool_number || ""}
                        readOnly={true}
                        className="bg-muted/50 text-muted-foreground cursor-not-allowed"
                        placeholder="—"
                      />
                    </div>
                    <div>
                      <Label>Vendor ID (Reference)</Label>
                      <Input
                        value={formData.vendor_id || ""}
                        readOnly={true}
                        className="bg-muted/50 text-muted-foreground cursor-not-allowed"
                        placeholder="—"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Condition {item?.status === "maintenance" ? "(Auto-locked)" : ""}</Label>
                      <Select
                        value={formData.condition || ""}
                        onValueChange={(v) => setFormData((p) => ({ ...p, condition: v }))}
                        disabled={item?.status === "maintenance"}
                      >
                        <SelectTrigger className={item?.status === "maintenance" ? "bg-muted/50 text-muted-foreground cursor-not-allowed" : ""}>
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
                      {item?.status === "maintenance" && (
                        <p className="text-xs text-muted-foreground mt-1">Condition locked to "Needs Repair" while in maintenance</p>
                      )}
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
            </TabsContent>

            <TabsContent value="update" className="mt-6">
              {/* Add Update & history */}
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
                  <Label>Title *</Label>
                  <Input
                    value={updateForm.title}
                    onChange={(e) => setUpdateForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Brief title for this update"
                  />
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
                  <Label>Technician Name</Label>
                  <Input
                    value={updateForm.technician_name}
                    onChange={(e) => setUpdateForm((p) => ({ ...p, technician_name: e.target.value }))}
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
                      console.log("Add Update button clicked", updateForm); // Debug log
                      if (!updateForm.title.trim()) {
                        toast.error("Title is required");
                        return;
                      }
                      if (!updateForm.description.trim()) {
                        toast.error("Description is required");
                        return;
                      }
                      addUpdateMutation.mutate(updateForm);
                    }}
                    disabled={addUpdateMutation.isPending}
                    className="bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold hover:from-orange-700 hover:to-orange-800"
                  >
                    {addUpdateMutation.isPending ? "Adding..." : "Add Maintenance Update"}
                  </Button>
                </div>
              </div>
            </div>

                {/* Recent updates timeline */}
                <div className="bg-white border rounded-xl p-4">
                  <h4 className="font-medium mb-3">Recent Updates</h4>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {(updates || []).length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-8">
                        No maintenance updates yet
                      </div>
                     ) : (
                        (updates || []).map((update: any) => (
                          <div key={update.id} className="border rounded-lg p-4 relative min-h-[200px] flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      update.update_type === 'progress' 
                                        ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white border-orange-600' 
                                        : ''
                                    }`}
                                  >
                                    {update.update_type === 'progress' ? 'Progress' : update.update_type}
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteUpdate(update.id)}
                                    className="h-6 px-2 text-xs hover:bg-destructive hover:text-destructive-foreground"
                                  >
                                    Delete
                                  </Button>
                                </div>
                               <div className="text-xs text-muted-foreground">
                                 {new Date(update.created_at).toLocaleDateString()}
                               </div>
                             </div>
                             {update.title && (
                               <div className="text-sm font-medium mb-2">{update.title}</div>
                             )}
                             <div className="text-sm mb-3 line-clamp-2">{update.description}</div>
                           </div>
                           <div className="space-y-1">
                             {update.technician_name && (
                               <div className="text-xs text-muted-foreground">
                                 Technician: {update.technician_name}
                               </div>
                             )}
                             <div className="flex gap-4 text-xs text-muted-foreground">
                               {update.labor_hours > 0 && (
                                 <span>Labor: {update.labor_hours}h</span>
                               )}
                               {update.cost_amount > 0 && (
                                 <span>Total Cost: ${update.cost_amount}</span>
                               )}
                               {update.parts_used && Array.isArray(update.parts_used) && update.parts_used.length > 0 && (
                                 <span>Parts: {update.parts_used.join(', ')}</span>
                               )}
                             </div>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
      
    </Dialog>
  );
};