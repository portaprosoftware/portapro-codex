import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Gauge, 
  Calendar, 
  Settings,
  Wrench,
  FileText,
  Play
} from "lucide-react";
import { AddWorkOrderDrawer } from "./work-orders/AddWorkOrderDrawer";
import { AssignPMTemplateDialog } from "./pm/AssignPMTemplateDialog";
import { ActivePMSchedulesList } from "./pm/ActivePMSchedulesList";

interface PMSchedulesTabProps {
  vehicleId?: string;
  licensePlate?: string;
}

export const PMSchedulesTab: React.FC<PMSchedulesTabProps> = ({ vehicleId, licensePlate }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [selectedTemplateForWO, setSelectedTemplateForWO] = useState<any>(null);
  const [isWorkOrderDrawerOpen, setIsWorkOrderDrawerOpen] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    asset_type: "vehicle",
    trigger_type: "mileage",
    trigger_interval: "",
    trigger_config: {},
    estimated_labor_hours: "",
    estimated_cost: "",
    checklist_items: [] as any[],
    parts_list: [] as any[],
    is_active: true
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["pm-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pm_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const { error } = await supabase.from("pm_templates").insert(templateData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm-templates"] });
      toast.success("PM Template created successfully");
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to create PM template");
      console.error(error);
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("pm_templates").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm-templates"] });
      toast.success("PM Template updated successfully");
      setEditingTemplate(null);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to update PM template");
      console.error(error);
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pm_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm-templates"] });
      toast.success("PM Template deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete PM template");
      console.error(error);
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      asset_type: "vehicle",
      trigger_type: "mileage",
      trigger_interval: "",
      trigger_config: {},
      estimated_labor_hours: "",
      estimated_cost: "",
      checklist_items: [],
      parts_list: [],
      is_active: true
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    const templateData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      asset_type: formData.asset_type,
      trigger_type: formData.trigger_type,
      trigger_interval: formData.trigger_interval ? Number(formData.trigger_interval) : null,
      trigger_config: formData.trigger_config,
      estimated_labor_hours: formData.estimated_labor_hours ? Number(formData.estimated_labor_hours) : null,
      estimated_cost: formData.estimated_cost ? Number(formData.estimated_cost) : null,
      checklist_items: formData.checklist_items,
      parts_list: formData.parts_list,
      is_active: formData.is_active
    };

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateData });
    } else {
      createTemplateMutation.mutate(templateData);
    }
  };

  const handleEdit = (template: any) => {
    setFormData({
      name: template.name,
      description: template.description || "",
      asset_type: template.asset_type,
      trigger_type: template.trigger_type,
      trigger_interval: template.trigger_interval?.toString() || "",
      trigger_config: template.trigger_config || {},
      estimated_labor_hours: template.estimated_labor_hours?.toString() || "",
      estimated_cost: template.estimated_cost?.toString() || "",
      checklist_items: template.checklist_items || [],
      parts_list: template.parts_list || [],
      is_active: template.is_active
    });
    setEditingTemplate(template);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this PM template?")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const handleCreateWorkOrder = (template: any) => {
    setSelectedTemplateForWO(template);
    setIsWorkOrderDrawerOpen(true);
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'mileage': return <Gauge className="w-5 h-5" />;
      case 'hours': return <Clock className="w-5 h-5" />;
      case 'days': return <Calendar className="w-5 h-5" />;
      case 'multi': return <Settings className="w-5 h-5" />;
      default: return <Wrench className="w-5 h-5" />;
    }
  };

  const getGradientColors = (index: number) => {
    const gradients = [
      { from: '#3b82f6', to: '#2563eb', bg: 'from-blue-500 to-blue-600' },
      { from: '#8b5cf6', to: '#7c3aed', bg: 'from-purple-500 to-purple-600' },
      { from: '#06b6d4', to: '#0891b2', bg: 'from-cyan-500 to-cyan-600' },
      { from: '#10b981', to: '#059669', bg: 'from-emerald-500 to-emerald-600' },
      { from: '#f59e0b', to: '#d97706', bg: 'from-amber-500 to-amber-600' },
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">PM Templates</TabsTrigger>
          <TabsTrigger value="schedules">Active Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">PM Templates</h2>
              <p className="text-gray-600">Reusable maintenance templates for your fleet</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => { resetForm(); setEditingTemplate(null); }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New PM Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? "Edit PM Template" : "Create PM Template"}
                  </DialogTitle>
                  <DialogDescription>
                    Create a reusable maintenance template for your fleet
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="name">Template Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Oil Change, Brake Inspection"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Brief description of this maintenance type..."
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="asset_type">Asset Type</Label>
                          <Select value={formData.asset_type} onValueChange={(value) => setFormData({ ...formData, asset_type: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vehicle">Vehicle</SelectItem>
                              <SelectItem value="trailer">Trailer</SelectItem>
                              <SelectItem value="equipment">Equipment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="trigger_type">Trigger Type</Label>
                          <Select value={formData.trigger_type} onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mileage">Mileage Based</SelectItem>
                              <SelectItem value="hours">Engine Hours</SelectItem>
                              <SelectItem value="days">Time Based (Days)</SelectItem>
                              <SelectItem value="multi">Multi-Trigger</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {formData.trigger_type !== 'multi' && (
                        <div>
                          <Label htmlFor="trigger_interval">Trigger Interval</Label>
                          <Input
                            id="trigger_interval"
                            type="number"
                            value={formData.trigger_interval}
                            onChange={(e) => setFormData({ ...formData, trigger_interval: e.target.value })}
                            placeholder={formData.trigger_type === 'mileage' ? '5000' : formData.trigger_type === 'hours' ? '250' : '90'}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Cost & Labor Estimates</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="estimated_cost">Estimated Cost ($)</Label>
                        <Input
                          id="estimated_cost"
                          type="number"
                          step="0.01"
                          value={formData.estimated_cost}
                          onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                          placeholder="150.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="estimated_labor_hours">Estimated Labor (hours)</Label>
                        <Input
                          id="estimated_labor_hours"
                          type="number"
                          step="0.5"
                          value={formData.estimated_labor_hours}
                          onChange={(e) => setFormData({ ...formData, estimated_labor_hours: e.target.value })}
                          placeholder="2.0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Template Active</Label>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      {editingTemplate ? "Update Template" : "Create Template"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-8">
                  <p className="text-gray-500 text-center">Loading templates...</p>
                </CardContent>
              </Card>
            ) : templates?.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No PM Templates</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Create reusable maintenance templates to streamline work order creation
                  </p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              templates.map((template, index) => {
                const gradient = getGradientColors(index);
                return (
                  <Card key={template.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: gradient.from }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient.bg} flex items-center justify-center shadow-lg text-white`}
                          >
                            {getTriggerIcon(template.trigger_type)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold">{template.name}</h3>
                            {template.description && (
                              <p className="text-sm text-gray-600">{template.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={template.is_active ? "default" : "secondary"} className="text-xs">
                            {template.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Trigger</p>
                          <p className="font-semibold">
                            Every {template.trigger_interval} {template.trigger_type}
                          </p>
                        </div>
                        {template.estimated_cost && (
                          <div>
                            <p className="text-xs text-gray-500">Est. Cost</p>
                            <p className="font-semibold">${template.estimated_cost}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <AssignPMTemplateDialog template={template} />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreateWorkOrder(template)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Create Work Order
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="schedules" className="mt-6">
          <ActivePMSchedulesList vehicleId={vehicleId} />
        </TabsContent>
      </Tabs>

      {selectedTemplateForWO && (
        <AddWorkOrderDrawer
          open={isWorkOrderDrawerOpen}
          onOpenChange={setIsWorkOrderDrawerOpen}
          onSuccess={() => {
            setIsWorkOrderDrawerOpen(false);
            setSelectedTemplateForWO(null);
          }}
          vehicleContextId={vehicleId}
          pmTemplate={selectedTemplateForWO}
        />
      )}
    </div>
  );
};
