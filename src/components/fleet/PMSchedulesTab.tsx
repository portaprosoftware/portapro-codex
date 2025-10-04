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
import { PMTemplateBuilder } from "./pm/PMTemplateBuilder";

interface PMSchedulesTabProps {
  vehicleId?: string;
  licensePlate?: string;
}

export const PMSchedulesTab: React.FC<PMSchedulesTabProps> = ({ vehicleId, licensePlate }) => {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [selectedTemplateForWO, setSelectedTemplateForWO] = useState<any>(null);
  const [isWorkOrderDrawerOpen, setIsWorkOrderDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>("all");
  const [triggerTypeFilter, setTriggerTypeFilter] = useState<string>("all");
  const queryClient = useQueryClient();

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

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setIsBuilderOpen(true);
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

  // Filter templates based on search and filters
  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssetType = assetTypeFilter === "all" || template.asset_type === assetTypeFilter;
    const matchesTriggerType = triggerTypeFilter === "all" || template.trigger_type === triggerTypeFilter;
    
    return matchesSearch && matchesAssetType && matchesTriggerType;
  });

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
            <Button 
              onClick={() => { setEditingTemplate(null); setIsBuilderOpen(true); }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              New PM Template
            </Button>
          </div>

          {/* Filter Card */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search Templates</Label>
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Asset Type</Label>
                <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Asset Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Asset Types</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="trailer">Trailer</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="pump_truck">Pump Truck</SelectItem>
                    <SelectItem value="portable_unit">Portable Unit</SelectItem>
                    <SelectItem value="handwash_station">Handwash Station</SelectItem>
                    <SelectItem value="generator_heater">Generator / Heater</SelectItem>
                    <SelectItem value="shop_equipment">Shop Equipment</SelectItem>
                    <SelectItem value="inventory_consumables">Inventory / Consumables</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select value={triggerTypeFilter} onValueChange={setTriggerTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Trigger Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trigger Types</SelectItem>
                    <SelectItem value="mileage">Mileage-Based</SelectItem>
                    <SelectItem value="days">Time-Based (Days)</SelectItem>
                    <SelectItem value="hours">Engine Hours</SelectItem>
                    <SelectItem value="job_count">Job Count</SelectItem>
                    <SelectItem value="pump_hours">Pump Hours</SelectItem>
                    <SelectItem value="event_based">Event-Based (DVIR Fail / Incident)</SelectItem>
                    <SelectItem value="seasonal">Seasonal / Calendar</SelectItem>
                    <SelectItem value="manual">Manual / On-Demand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <div className="grid gap-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-8">
                  <p className="text-gray-500 text-center">Loading templates...</p>
                </CardContent>
              </Card>
            ) : filteredTemplates?.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Templates Found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {searchTerm || assetTypeFilter !== "all" || triggerTypeFilter !== "all"
                      ? "No templates match your search criteria. Try adjusting your filters."
                      : "Create reusable maintenance templates to streamline work order creation"}
                  </p>
                  {!searchTerm && assetTypeFilter === "all" && triggerTypeFilter === "all" && (
                    <Button 
                      onClick={() => { setEditingTemplate(null); setIsBuilderOpen(true); }}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Template
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredTemplates.map((template, index) => {
                const gradient = getGradientColors(index);
                return (
                  <Card key={template.id} className={`overflow-hidden border-l-4 ${!template.is_active ? 'opacity-60' : ''}`} style={{ borderLeftColor: template.is_active ? gradient.from : '#9CA3AF' }}>
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
                          <Badge variant={template.is_active ? "active" : "inactive"} className="text-xs">
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
                        <AssignPMTemplateDialog template={template} vehicleId={vehicleId} />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreateWorkOrder(template)}
                        >
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

      <PMTemplateBuilder
        open={isBuilderOpen}
        onOpenChange={setIsBuilderOpen}
        template={editingTemplate}
      />
    </div>
  );
};
