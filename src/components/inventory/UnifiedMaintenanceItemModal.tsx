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
import { Clock, DollarSign, MapPin, Settings, Wrench, Trash2, Plus, X, CheckCircle2, Trash } from "lucide-react";
import { SimpleMaintenancePhotoUpload } from "./SimpleMaintenancePhotoUpload";
import { MaintenanceUpdatePhotos } from "./MaintenanceUpdatePhotos";
import { ImageViewerModal } from "./ImageViewerModal";
import { useSystemUsers } from "@/hooks/useSystemUsers";


interface StorageLocation { id: string; name: string }

interface UnifiedMaintenanceItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  productId: string;
  storageLocations: StorageLocation[] | undefined;
  activeTab?: "details" | "workorders" | "update";
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

interface UpdatePhoto {
  file: File;
  preview: string;
  caption: string;
}

export const UnifiedMaintenanceItemModal: React.FC<UnifiedMaintenanceItemModalProps> = ({
  isOpen,
  onClose,
  item,
  productId,
  storageLocations,
  activeTab: initialActiveTab = "details",
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const { data: systemUsers = [] } = useSystemUsers();
  const [shouldCloseOnSave, setShouldCloseOnSave] = useState(true);


  // Update active tab when initialActiveTab changes
  useEffect(() => {
    setActiveTab(initialActiveTab);
  }, [initialActiveTab]);

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

  const [workOrderForm, setWorkOrderForm] = useState({
    work_order_name: "",
    work_order_type: "repair",
    technicians: [{ name: "" }],
    labor_hours: "",
    labor_cost: "",
    labor_cost_type: "total",
    parts: [{ parts_used: "", parts_cost: "" }],
    status: "work_order_created",
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
      // Validate that storage location is provided for maintenance items
      if (!data.current_storage_location_id) {
        throw new Error("Storage location is required for maintenance items");
      }
      
      // Upload maintenance photos first if any
      if (maintenancePhotos.length > 0) {
        const photoPromises = maintenancePhotos.map(async (photo, index) => {
          const fileExt = photo.file.name.split('.').pop();
          const fileName = `maintenance-${itemId}-${Date.now()}-${index}.${fileExt}`;
          const filePath = `unit-photos/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('unit-photos')
            .upload(filePath, photo.file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('unit-photos')
            .getPublicUrl(filePath);

          // Save to database
          const { error: dbError } = await supabase
            .from('product_item_photos')
            .insert({
              product_item_id: itemId,
              photo_url: publicUrl,
              caption: photo.caption || null,
              display_order: index,
            });

          if (dbError) throw dbError;
          return publicUrl;
        });

        await Promise.all(photoPromises);
      }
      
      const { error } = await supabase
        .from("product_items")
        .update({
          maintenance_reason: data.maintenance_reason,
          maintenance_notes: data.maintenance_notes,
          expected_return_date: data.expected_return_date || null,
          maintenance_priority: data.maintenance_priority,
          current_storage_location_id: data.current_storage_location_id,
          condition: data.condition || null,
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item updated", {
        duration: 2000,
        icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      });
      queryClient.invalidateQueries({ queryKey: ["maintenance-items", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-items", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-item", item.id] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-photos", itemId] });
      setMaintenancePhotos([]);
      
      // Only close if shouldCloseOnSave flag is true
      if (shouldCloseOnSave) {
        onClose();
      }
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

  const [updatePhotos, setUpdatePhotos] = useState<UpdatePhoto[]>([]);
  const [maintenancePhotos, setMaintenancePhotos] = useState<UpdatePhoto[]>([]);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<any[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const saveWorkOrderMutation = useMutation({
    mutationFn: async (data: typeof workOrderForm) => {
      if (!itemId) throw new Error("Item ID is required");
      
      // Validate required fields
      if (data.technicians.length === 0 || !data.technicians[0].name) {
        throw new Error("At least one technician is required");
      }

      // Combine technician names
      const technicianNames = data.technicians
        .filter(t => t.name.trim())
        .map(t => t.name.trim())
        .join(", ");

      // Calculate total parts cost
      const totalPartsCost = data.parts.reduce((sum, part) => {
        return sum + (parseFloat(part.parts_cost) || 0);
      }, 0);

      // Combine parts descriptions
      const partsUsed = data.parts
        .filter(p => p.parts_used.trim())
        .map(p => p.parts_used.trim())
        .join(", ");

      // Calculate total cost
      const laborCost = parseFloat(data.labor_cost) || 0;
      const laborHours = parseFloat(data.labor_hours) || 0;
      const actualLaborCost = data.labor_cost_type === "per_hour" 
        ? laborCost * laborHours 
        : laborCost;
      const totalCost = actualLaborCost + totalPartsCost;

      // Normalize parts used to array for DB
      const partsUsedArray = data.parts
        .filter((p) => p.parts_used.trim())
        .map((p) => p.parts_used.trim());

      // Insert work order as a maintenance update
      const { error } = await supabase
        .from("maintenance_updates")
        .insert({
          item_id: itemId,
          update_type: "repair",
          title: "Work Order",
          description: `Technician(s): ${technicianNames}\nLabor Hours: ${laborHours}\nParts Used: ${partsUsed || "None"}`,
          technician_name: technicianNames,
          labor_hours: laborHours,
          cost_amount: totalCost,
          parts_used: partsUsedArray,
          attachments: null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Work order saved", {
        duration: 2000,
        icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      });
      queryClient.invalidateQueries({ queryKey: ["maintenance-updates", itemId] });
      
      // Reset work order form
      setWorkOrderForm({
        work_order_name: "",
        work_order_type: "repair",
        technicians: [{ name: "" }],
        labor_hours: "",
        labor_cost: "",
        labor_cost_type: "total",
        parts: [{ parts_used: "", parts_cost: "" }],
        status: "work_order_created",
      });
    },
    onError: (err: any) => {
      console.error("Work order save error:", err);
      toast.error(err.message || "Failed to save work order");
    },
  });

  const addUpdateMutation = useMutation({
    mutationFn: async (data: MaintenanceUpdateForm) => {
      if (!itemId) return;
      
      // Upload photos first if any
      let attachments: any[] = [];
      if (updatePhotos.length > 0) {
        const photoPromises = updatePhotos.map(async (photo, index) => {
          const fileExt = photo.file.name.split('.').pop();
          const fileName = `update-${itemId}-${Date.now()}-${index}.${fileExt}`;
          const filePath = `unit-photos/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('unit-photos')
            .upload(filePath, photo.file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('unit-photos')
            .getPublicUrl(filePath);

          return {
            type: 'photo',
            url: publicUrl,
            caption: photo.caption || null,
            filename: photo.file.name
          };
        });

        attachments = await Promise.all(photoPromises);
      }
      
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
          attachments: attachments.length > 0 ? attachments : null,
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
      setUpdatePhotos([]);
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
          <DialogDescription>
            Manage maintenance item details, location, and updates for this unit
          </DialogDescription>
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
          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as "details" | "workorders" | "update")} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Unit Details</TabsTrigger>
              <TabsTrigger value="workorders">Work Orders</TabsTrigger>
              <TabsTrigger value="update">Progress Updates</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              {/* Edit form */}
              <form onSubmit={handleItemSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Repair Details */}
              <div className="bg-white border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4" />
                  <h4 className="font-medium">Repair Details</h4>
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

                  {/* Maintenance Photos Section */}
                  <div className="mt-4 pt-4 border-t">
                    <SimpleMaintenancePhotoUpload 
                      itemId={item?.id} 
                      photos={maintenancePhotos}
                      onPhotosChange={setMaintenancePhotos}
                      maxPhotos={5}
                      onPhotoClick={(photos, index) => {
                        setSelectedPhotos(photos);
                        setSelectedPhotoIndex(index);
                        setImageViewerOpen(true);
                      }}
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
                       <Label>Storage Location (Required)</Label>
                       <Select
                         value={formData.current_storage_location_id || ""}
                         onValueChange={(v) => setFormData((p) => ({ ...p, current_storage_location_id: v || null }))}
                       >
                         <SelectTrigger className={!formData.current_storage_location_id ? "border-red-300" : ""}>
                           <SelectValue placeholder="Storage location required" />
                         </SelectTrigger>
                         <SelectContent>
                           {(storageLocations || []).map((loc) => (
                             <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                       {!formData.current_storage_location_id && (
                         <p className="text-xs text-red-600">Storage location is mandatory for maintenance items</p>
                       )}
                     </div>
                   </div>
                </div>

                <div className="bg-white border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4" />
                    <h4 className="font-medium">Unit Details (view only)</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Tool Number</Label>
                      <Input
                        value={formData.tool_number || ""}
                        readOnly={true}
                        className="bg-muted/50 text-muted-foreground cursor-not-allowed"
                        placeholder="—"
                      />
                    </div>
                    <div>
                      <Label>Vendor ID</Label>
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
                
                {/* Notes Card - In Right Column */}
                <div className="bg-white border rounded-xl p-4">
                  <h4 className="font-medium mb-3">Notes</h4>
                  <Textarea
                    rows={3}
                    value={formData.maintenance_notes}
                    onChange={(e) => setFormData((p) => ({ ...p, maintenance_notes: e.target.value }))}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>
                
            {/* Save controls at the bottom */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                type="button" 
                className="bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={updateItemMutation.isPending}
                onClick={() => {
                  setShouldCloseOnSave(false);
                  const formElement = document.querySelector('form') as HTMLFormElement;
                  if (formElement) {
                    formElement.requestSubmit();
                  }
                  setTimeout(() => setShouldCloseOnSave(true), 100);
                }}
              >
                {updateItemMutation.isPending ? "Saving..." : "Save & Continue"}
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={updateItemMutation.isPending}>
                {updateItemMutation.isPending ? "Saving..." : "Save & Close"}
              </Button>
            </div>
              </form>
            </TabsContent>

            <TabsContent value="workorders" className="mt-6">
              {/* Work Orders Tab */}
              <div className="bg-white border rounded-xl p-6">
                <h4 className="font-medium mb-4">Work Order Details</h4>
                <div className="space-y-4">
                  <div>
                    <Label>Work Order Name</Label>
                    <Input
                      value={workOrderForm.work_order_name}
                      onChange={(e) => setWorkOrderForm((p) => ({ ...p, work_order_name: e.target.value }))}
                      placeholder="Enter work order name"
                    />
                  </div>
                  <div>
                    <Label>Work Order Type</Label>
                    <Select
                      value={workOrderForm.work_order_type}
                      onValueChange={(v) => setWorkOrderForm((p) => ({ ...p, work_order_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="repair">Repair Work</SelectItem>
                        <SelectItem value="parts">Parts Replacement</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Technician Name(s)</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setWorkOrderForm((p) => ({
                            ...p,
                            technicians: [...p.technicians, { name: "" }],
                          }));
                        }}
                        className="h-8 px-2"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Technician
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {workOrderForm.technicians.map((tech, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="flex-1 space-y-2">
                            <Input
                              value={tech.name}
                              onChange={(e) => {
                                const newTechs = [...workOrderForm.technicians];
                                newTechs[index] = { name: e.target.value };
                                setWorkOrderForm((p) => ({ ...p, technicians: newTechs }));
                              }}
                              placeholder="Who performed this work?"
                              list={`technician-suggestions-${index}`}
                            />
                            <datalist id={`technician-suggestions-${index}`}>
                              {systemUsers.map((user) => (
                                <option key={user.id} value={user.name} />
                              ))}
                            </datalist>
                          </div>
                          {workOrderForm.technicians.length > 1 && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                const newTechs = workOrderForm.technicians.filter((_, i) => i !== index);
                                setWorkOrderForm((p) => ({ ...p, technicians: newTechs }));
                              }}
                              className="h-10 w-10 mt-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Labor Hours</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={workOrderForm.labor_hours}
                        onChange={(e) => setWorkOrderForm((p) => ({ ...p, labor_hours: e.target.value }))}
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <Label>Labor Cost ($)</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={workOrderForm.labor_cost}
                            onChange={(e) => setWorkOrderForm((p) => ({ ...p, labor_cost: e.target.value }))}
                            placeholder="0.00"
                            className="pl-7"
                          />
                        </div>
                        <Select
                          value={workOrderForm.labor_cost_type}
                          onValueChange={(v) => setWorkOrderForm((p) => ({ ...p, labor_cost_type: v }))}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="total">Total</SelectItem>
                            <SelectItem value="per_hour">Per Hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Parts Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Parts</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setWorkOrderForm((p) => ({ 
                          ...p, 
                          parts: [...p.parts, { parts_used: "", parts_cost: "" }] 
                        }))}
                        className="h-8 gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Part
                      </Button>
                    </div>
                    
                    {workOrderForm.parts.map((part, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Input
                              value={part.parts_used}
                              onChange={(e) => {
                                const newParts = [...workOrderForm.parts];
                                newParts[index].parts_used = e.target.value;
                                setWorkOrderForm((p) => ({ ...p, parts: newParts }));
                              }}
                              placeholder="List parts used"
                            />
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={part.parts_cost}
                              onChange={(e) => {
                                const newParts = [...workOrderForm.parts];
                                newParts[index].parts_cost = e.target.value;
                                setWorkOrderForm((p) => ({ ...p, parts: newParts }));
                              }}
                              placeholder="0.00"
                              className="pl-7"
                            />
                          </div>
                        </div>
                        {workOrderForm.parts.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newParts = workOrderForm.parts.filter((_, i) => i !== index);
                              setWorkOrderForm((p) => ({ ...p, parts: newParts }));
                            }}
                            className="h-10 w-10 p-0 text-gray-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select
                      value={workOrderForm.status}
                      onValueChange={(v) => setWorkOrderForm((p) => ({ ...p, status: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="work_order_created">Work Order Created</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="waiting_on_parts">Waiting on Parts</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button 
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => saveWorkOrderMutation.mutate(workOrderForm)}
                      disabled={saveWorkOrderMutation.isPending}
                    >
                      {saveWorkOrderMutation.isPending ? "Saving..." : "Save Work Order"}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="update" className="mt-6">
              {/* Add Update & history */}
              <div className="space-y-5">
                {/* Recent updates timeline */}
                <div className="bg-white border rounded-xl p-4">
                  <h4 className="font-medium mb-3">Open Work Orders</h4>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {(updates || []).length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-8">
                        No maintenance updates yet
                      </div>
                     ) : (
                        (updates || []).map((update: any) => {
                          const isWorkOrder = update.title === "Work Order";
                          return (
                          <div key={update.id} className={`border rounded-lg p-4 relative flex flex-col ${isWorkOrder ? 'border-gray-300 bg-gray-100' : ''}`}>
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  {!isWorkOrder && (
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs font-bold ${
                                        update.update_type === 'progress' 
                                          ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white border-orange-600' 
                                          : update.update_type === 'repair'
                                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600'
                                          : update.update_type === 'parts'
                                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-600'
                                          : 'bg-gradient-to-r from-green-600 to-green-700 text-white border-green-600'
                                      }`}
                                    >
                                      {update.update_type === 'progress' ? 'Progress' : 
                                       update.update_type === 'repair' ? 'Repair' :
                                       update.update_type === 'parts' ? 'Parts' : 
                                       update.update_type}
                                    </Badge>
                                  )}
                                  {isWorkOrder && (
                                    <Select
                                      value={update.status || "work_order_created"}
                                      onValueChange={(v) => {
                                        // TODO: Update status in database
                                        toast.success("Status updated");
                                      }}
                                    >
                                      <SelectTrigger className="h-7 w-[180px] text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="work_order_created">Work Order Created</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="waiting_on_parts">Waiting on Parts</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                               <div className="text-xs text-muted-foreground">
                                 {new Date(update.created_at).toLocaleDateString()}
                               </div>
                             </div>
                             {update.title && !isWorkOrder && (
                               <div className="text-sm font-medium mb-2">{update.title}</div>
                             )}
                             {!isWorkOrder && (
                               <div className="text-sm mb-2 line-clamp-2">{update.description}</div>
                             )}
                             
                              {/* Display attached photos */}
                              {update.attachments && Array.isArray(update.attachments) && update.attachments.length > 0 && (
                                <div className="flex gap-2 mb-3">
                                  {update.attachments.filter((att: any) => att.type === 'photo').map((photo: any, index: number) => (
                                    <div key={index} className="relative">
                                      <img
                                        src={photo.url}
                                        alt={photo.caption || `Update photo ${index + 1}`}
                                        className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => {
                                          const photos = update.attachments.filter((att: any) => att.type === 'photo');
                                          setSelectedPhotos(photos);
                                          setSelectedPhotoIndex(index);
                                          setImageViewerOpen(true);
                                        }}
                                      />
                                      {photo.caption && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b truncate">
                                          {photo.caption}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                           </div>
                           <div className="space-y-1 mt-2">
                             {update.technician_name && (
                               <div className="text-sm text-muted-foreground">
                                 Technician: {update.technician_name}
                               </div>
                             )}
                             <div className="flex gap-4 text-sm text-muted-foreground">
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
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Add Update Form - Moved Below */}
                <div className="bg-white border rounded-xl p-4">
                  <h4 className="font-medium mb-3">Add Work Order Update</h4>
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
                    
                    {/* Photo Upload Section */}
                    <div className="pt-3 border-t">
                      <MaintenanceUpdatePhotos 
                        photos={updatePhotos}
                        onPhotosChange={setUpdatePhotos}
                        maxPhotos={2}
                      />
                    </div>

                    <div className="flex justify-end pt-3">
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
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800"
                      >
                        {addUpdateMutation.isPending ? "Adding..." : "Add Maintenance Update"}
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
      
      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        photos={selectedPhotos}
        initialIndex={selectedPhotoIndex}
      />

    </Dialog>
  );
};