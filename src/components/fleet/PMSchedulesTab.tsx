import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Gauge, 
  Calendar, 
  Settings,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface PMSchedulesTabProps {
  vehicleId?: string;
}

export const PMSchedulesTab: React.FC<PMSchedulesTabProps> = ({ vehicleId }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger_type: "miles",
    trigger_miles_every: "",
    trigger_hours_every: "",
    trigger_days_every: "",
    grace_miles: "3",
    grace_hours: "3",
    grace_days: "3",
    default_priority: "normal",
    auto_create_work_order: true,
    instructions: ""
  });

  // Fetch PM schedules
  const { data: schedules, isLoading } = useQuery({
    queryKey: ["pm-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pm_schedules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      const { error } = await supabase.from("pm_schedules").insert(scheduleData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm-schedules"] });
      toast.success("PM Schedule created successfully");
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to create PM schedule");
      console.error(error);
    }
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("pm_schedules").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm-schedules"] });
      toast.success("PM Schedule updated successfully");
      setEditingSchedule(null);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to update PM schedule");
      console.error(error);
    }
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pm_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm-schedules"] });
      toast.success("PM Schedule deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete PM schedule");
      console.error(error);
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      trigger_type: "miles",
      trigger_miles_every: "",
      trigger_hours_every: "",
      trigger_days_every: "",
      grace_miles: "3",
      grace_hours: "3", 
      grace_days: "3",
      default_priority: "normal",
      auto_create_work_order: true,
      instructions: ""
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Schedule name is required");
      return;
    }

    const scheduleData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      trigger_miles_every: formData.trigger_miles_every ? Number(formData.trigger_miles_every) : null,
      trigger_hours_every: formData.trigger_hours_every ? Number(formData.trigger_hours_every) : null,
      trigger_days_every: formData.trigger_days_every ? Number(formData.trigger_days_every) : null,
      grace_miles: Number(formData.grace_miles),
      grace_hours: Number(formData.grace_hours),
      grace_days: Number(formData.grace_days),
      default_priority: formData.default_priority,
      auto_create_work_order: formData.auto_create_work_order,
      instructions: formData.instructions.trim() || "{}",
      active: true
    };

    if (editingSchedule) {
      updateScheduleMutation.mutate({ id: editingSchedule.id, data: scheduleData });
    } else {
      createScheduleMutation.mutate(scheduleData);
    }
  };

  const handleEdit = (schedule: any) => {
    setFormData({
      name: schedule.name,
      description: schedule.description || "",
      trigger_type: "miles",
      trigger_miles_every: schedule.trigger_miles_every?.toString() || "",
      trigger_hours_every: schedule.trigger_hours_every?.toString() || "",
      trigger_days_every: schedule.trigger_days_every?.toString() || "",
      grace_miles: schedule.grace_miles?.toString() || "3",
      grace_hours: schedule.grace_hours?.toString() || "3",
      grace_days: schedule.grace_days?.toString() || "3",
      default_priority: schedule.default_priority,
      auto_create_work_order: schedule.auto_create_work_order,
      instructions: typeof schedule.instructions === 'string' ? schedule.instructions : ""
    });
    setEditingSchedule(schedule);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this PM schedule?")) {
      deleteScheduleMutation.mutate(id);
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'normal': return 'outline';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getTriggerDisplay = (schedule: any) => {
    const triggers = [];
    if (schedule.trigger_miles_every) triggers.push(`${schedule.trigger_miles_every} miles`);
    if (schedule.trigger_hours_every) triggers.push(`${schedule.trigger_hours_every} hours`);
    if (schedule.trigger_days_every) triggers.push(`${schedule.trigger_days_every} days`);
    return triggers.join(" or ") || "No triggers set";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Preventive Maintenance Schedules</h2>
          <p className="text-muted-foreground">Configure automated maintenance schedules for your fleet</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingSchedule(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              New PM Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? "Edit PM Schedule" : "Create PM Schedule"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="name">Schedule Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Oil Change Service"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the maintenance"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.default_priority} onValueChange={(value) => setFormData({ ...formData, default_priority: value })}>
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
                      <Label htmlFor="grace_period">Grace Period (Days)</Label>
                      <Input
                        id="grace_period"
                        type="number"
                        value={formData.grace_days}
                        onChange={(e) => setFormData({ ...formData, grace_days: e.target.value })}
                        placeholder="3"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Trigger Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Schedule Triggers</h3>
                <div>
                  <Label htmlFor="trigger_type">Trigger Type</Label>
                  <Select value={formData.trigger_type} onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="miles">Mileage Based</SelectItem>
                      <SelectItem value="hours">Engine Hours</SelectItem>
                      <SelectItem value="days">Time Based</SelectItem>
                      <SelectItem value="combination">Combination (first to occur)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(formData.trigger_type === 'miles' || formData.trigger_type === 'combination') && (
                    <div>
                      <Label htmlFor="trigger_miles">Miles Interval</Label>
                      <Input
                        id="trigger_miles"
                        type="number"
                        value={formData.trigger_miles_every}
                        onChange={(e) => setFormData({ ...formData, trigger_miles_every: e.target.value })}
                        placeholder="5000"
                      />
                    </div>
                  )}
                  
                  {(formData.trigger_type === 'hours' || formData.trigger_type === 'combination') && (
                    <div>
                      <Label htmlFor="trigger_hours">Engine Hours Interval</Label>
                      <Input
                        id="trigger_hours"
                        type="number"
                        value={formData.trigger_hours_every}
                        onChange={(e) => setFormData({ ...formData, trigger_hours_every: e.target.value })}
                        placeholder="250"
                      />
                    </div>
                  )}
                  
                  {(formData.trigger_type === 'days' || formData.trigger_type === 'combination') && (
                    <div>
                      <Label htmlFor="trigger_days">Days Interval</Label>
                      <Input
                        id="trigger_days"
                        type="number"
                        value={formData.trigger_days_every}
                        onChange={(e) => setFormData({ ...formData, trigger_days_every: e.target.value })}
                        placeholder="90"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Automation */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Automation</h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_work_orders"
                    checked={formData.auto_create_work_order}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_create_work_order: checked })}
                  />
                  <Label htmlFor="auto_work_orders">Auto-create work orders when due</Label>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Instructions</h3>
                <div>
                  <Label htmlFor="instructions">Maintenance Instructions</Label>
                  <textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="Detailed instructions for performing this maintenance..."
                    rows={4}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingSchedule ? "Update Schedule" : "Create Schedule"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Schedules List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Loading schedules...</p>
            </CardContent>
          </Card>
        ) : schedules?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No PM Schedules</h3>
              <p className="text-muted-foreground mb-4">
                Create your first preventive maintenance schedule to automate fleet maintenance
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create PM Schedule
              </Button>
            </CardContent>
          </Card>
        ) : (
          schedules?.map((schedule: any) => (
            <Card key={schedule.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium">{schedule.name}</h3>
                      <Badge variant={getPriorityBadgeVariant(schedule.default_priority)}>
                        {schedule.default_priority}
                      </Badge>
                      {!schedule.active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    
                    {schedule.description && (
                      <p className="text-muted-foreground mb-3">{schedule.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Every:</span>
                        <span>{getTriggerDisplay(schedule)}</span>
                      </div>
                      
                      <div>
                        <span className="font-medium">Priority:</span>
                        <span className="ml-1 capitalize">{schedule.default_priority}</span>
                      </div>
                      
                      <div>
                        <span className="font-medium">Grace Period:</span>
                        <span className="ml-1">{schedule.grace_days} days</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      {schedule.auto_create_work_order && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Auto work orders
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {schedule.grace_days}d grace period
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(schedule)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(schedule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};