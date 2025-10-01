import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Drawer, 
  DrawerContent, 
  DrawerDescription, 
  DrawerFooter, 
  DrawerHeader, 
  DrawerTitle 
} from "@/components/ui/drawer";
import { CalendarDays, Plus, X, AlertTriangle, Wrench, Package, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAnalytics } from '@/hooks/useAnalytics';

interface AddWorkOrderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultDueDate?: string;
  preselectedAssetId?: string;
  vehicleContextId?: string | null;
  vehicleContextName?: string | null;
}

interface WorkOrderForm {
  source: string;
  asset_id: string;
  asset_type: string;
  priority: string;
  assignee_id: string;
  due_date: string;
  meter_at_open: string;
  description: string;
  tasks: string[];
  out_of_service: boolean;
  driver_verification_required: boolean;
  notify_assignee: boolean;
  notify_fleet_manager: boolean;
}

export const AddWorkOrderDrawer: React.FC<AddWorkOrderDrawerProps> = ({
  open,
  onOpenChange,
  onSuccess,
  defaultDueDate,
  preselectedAssetId = "",
  vehicleContextId = null,
  vehicleContextName = null
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { trackEvent } = useAnalytics();
  const isVehicleContextLocked = !!vehicleContextId;
  
  const [form, setForm] = useState<WorkOrderForm>({
    source: 'breakdown',
    asset_id: vehicleContextId || preselectedAssetId,
    asset_type: 'vehicle',
    priority: 'normal',
    assignee_id: '',
    due_date: defaultDueDate || '',
    meter_at_open: '',
    description: '',
    tasks: [],
    out_of_service: false,
    driver_verification_required: false,
    notify_assignee: true,
    notify_fleet_manager: false
  });

  const [newTask, setNewTask] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTask = () => {
    if (newTask.trim()) {
      setForm(prev => ({
        ...prev,
        tasks: [...prev.tasks, newTask.trim()]
      }));
      setNewTask('');
    }
  };

  const handleRemoveTask = (index: number) => {
    setForm(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!form.asset_id || !form.description) {
      toast({
        title: "Required fields missing",
        description: "Please fill in asset and description",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Auto-generate WO number
      const woNumber = `WO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      
      const payload = {
        work_order_number: woNumber,
        source: (form.source === "pm_schedule" ? "pm" : form.source) as "dvir_defect" | "pm" | "breakdown" | "other",
        asset_id: form.asset_id,
        asset_type: form.asset_type as "vehicle" | "trailer",
        priority: form.priority as "low" | "normal" | "high" | "critical",
        assigned_to: form.assignee_id || null,
        due_date: form.due_date || null,
        meter_at_open: form.meter_at_open ? parseFloat(form.meter_at_open) : null,
        description: form.description,
        tasks: form.tasks,
        out_of_service: form.out_of_service,
        driver_verification_required: form.driver_verification_required,
        status: 'open' as const,
        opened_at: new Date().toISOString(),
        source_context: isVehicleContextLocked ? 'vehicle_profile' : null,
      };

      const { error } = await supabase
        .from('work_orders')
        .insert(payload);

      if (error) throw error;

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-work-orders', vehicleContextId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-metrics', vehicleContextId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-activity', vehicleContextId] });

      toast({
        title: "Work order created",
        description: `${woNumber} has been created successfully`
      });

      trackEvent('vehicle_work_order_created', {
        vehicleId: vehicleContextId || form.asset_id,
        context: vehicleContextId ? 'vehicle_profile' : 'standalone',
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setForm({
        source: 'breakdown',
        asset_id: vehicleContextId || preselectedAssetId,
        asset_type: 'vehicle',
        priority: 'normal',
        assignee_id: '',
        due_date: '',
        meter_at_open: '',
        description: '',
        tasks: [],
        out_of_service: false,
        driver_verification_required: false,
        notify_assignee: true,
        notify_fleet_manager: false
      });
    } catch (error) {
      console.error('Error creating work order:', error);
      toast({
        title: "Error",
        description: "Failed to create work order",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Create Work Order</DrawerTitle>
          <DrawerDescription>
            Create a new work order in under 15 seconds with smart defaults
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto flex-1 space-y-6">
          {/* A) Basics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Source */}
              <div className="space-y-2">
                <Label>Source</Label>
                <RadioGroup value={form.source} onValueChange={(value) => setForm(prev => ({ ...prev, source: value }))}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dvir_defect" id="dvir" />
                    <Label htmlFor="dvir" className="text-sm">DVIR Defect</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pm_schedule" id="pm" />
                    <Label htmlFor="pm" className="text-sm">PM Schedule</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="breakdown" id="breakdown" />
                    <Label htmlFor="breakdown" className="text-sm">Breakdown/Other</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Asset and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Asset *</Label>
                  {isVehicleContextLocked ? (
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                      <Truck className="w-4 h-4" />
                      <span className="font-medium">{vehicleContextName || 'Selected Vehicle'}</span>
                      <Badge variant="secondary" className="ml-auto">Locked</Badge>
                    </div>
                  ) : (
                    <>
                      <Select value={form.asset_type} onValueChange={(value) => setForm(prev => ({ ...prev, asset_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vehicle">Vehicle</SelectItem>
                          <SelectItem value="trailer">Trailer</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Asset ID or select from list"
                        value={form.asset_id}
                        onChange={(e) => setForm(prev => ({ ...prev, asset_id: e.target.value }))}
                      />
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(value) => setForm(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                          Critical
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Assignee and Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assignee (optional)</Label>
                  <Select value={form.assignee_id} onValueChange={(value) => setForm(prev => ({ ...prev, assignee_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {/* Add dynamic technician options */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Due Date (optional)</Label>
                  <Input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setForm(prev => ({ ...prev, due_date: tomorrow.toISOString().split('T')[0] }));
                      }}
                    >
                      +1d
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        const threeDays = new Date();
                        threeDays.setDate(threeDays.getDate() + 3);
                        setForm(prev => ({ ...prev, due_date: threeDays.toISOString().split('T')[0] }));
                      }}
                    >
                      +3d
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        const oneWeek = new Date();
                        oneWeek.setDate(oneWeek.getDate() + 7);
                        setForm(prev => ({ ...prev, due_date: oneWeek.toISOString().split('T')[0] }));
                      }}
                    >
                      +1w
                    </Button>
                  </div>
                </div>
              </div>

              {/* Meter Reading */}
              <div className="space-y-2">
                <Label>Meter at Open</Label>
                <Input
                  type="number"
                  placeholder="Odometer or engine hours"
                  value={form.meter_at_open}
                  onChange={(e) => setForm(prev => ({ ...prev, meter_at_open: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* B) Work Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Work Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Problem Description *</Label>
                <Textarea
                  placeholder="Describe the issue or work to be performed"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Tasks (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a task..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                  <Button variant="outline" size="sm" onClick={handleAddTask}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {form.tasks.length > 0 && (
                  <div className="space-y-1">
                    {form.tasks.map((task, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{task}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTask(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* D) Flags & Follow-ups */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Flags & Follow-ups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="driver-verification"
                  checked={form.driver_verification_required}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, driver_verification_required: checked }))}
                />
                <Label htmlFor="driver-verification" className="text-sm">
                  Driver verification required
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="out-of-service"
                  checked={form.out_of_service}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, out_of_service: checked }))}
                />
                <Label htmlFor="out-of-service" className="text-sm">
                  Set asset Out of Service
                </Label>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium mb-2 block">Notify</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notify-assignee"
                      checked={form.notify_assignee}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, notify_assignee: checked }))}
                    />
                    <Label htmlFor="notify-assignee" className="text-sm">Assignee</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notify-fleet"
                      checked={form.notify_fleet_manager}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, notify_fleet_manager: checked }))}
                    />
                    <Label htmlFor="notify-fleet" className="text-sm">Fleet Manager</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DrawerFooter>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Work Order"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};