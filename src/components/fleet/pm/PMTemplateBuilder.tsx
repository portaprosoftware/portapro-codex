import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PMTemplateBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: any;
}

export const PMTemplateBuilder: React.FC<PMTemplateBuilderProps> = ({ open, onOpenChange, template }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assetType, setAssetType] = useState("vehicle");
  const [triggerType, setTriggerType] = useState("mileage");
  const [triggerInterval, setTriggerInterval] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [partsList, setPartsList] = useState<any[]>([]);

  useEffect(() => {
    if (template) {
      setName(template.name || "");
      setDescription(template.description || "");
      setAssetType(template.asset_type || "vehicle");
      setTriggerType(template.trigger_type || "mileage");
      setTriggerInterval(template.trigger_interval?.toString() || "");
      setEstimatedCost(template.estimated_cost?.toString() || "");
      setEstimatedHours(template.estimated_labor_hours?.toString() || "");
      setChecklistItems(template.checklist_items || []);
      setPartsList(template.parts_list || []);
    } else {
      reset();
    }
  }, [template, open]);

  const reset = () => {
    setName("");
    setDescription("");
    setAssetType("vehicle");
    setTriggerType("mileage");
    setTriggerInterval("");
    setEstimatedCost("");
    setEstimatedHours("");
    setChecklistItems([]);
    setPartsList([]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        name,
        description,
        asset_type: assetType,
        trigger_type: triggerType,
        trigger_interval: triggerInterval ? parseInt(triggerInterval) : null,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
        estimated_labor_hours: estimatedHours ? parseFloat(estimatedHours) : null,
        checklist_items: checklistItems,
        parts_list: partsList,
        is_active: true
      };

      if (template?.id) {
        const { error } = await supabase
          .from('pm_templates' as any)
          .update(data)
          .eq('id', template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pm_templates' as any)
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-templates'] });
      queryClient.invalidateQueries({ queryKey: ['pm-templates-active'] });
      toast({ title: template ? "Template updated" : "Template created" });
      onOpenChange(false);
      reset();
    }
  });

  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, { item: "", category: "Engine", severity: "major" }]);
  };

  const addPart = () => {
    setPartsList([...partsList, { part_name: "", qty: 1, unit_cost: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit" : "Create"} PM Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Oil Change & Filter Service" />
            </div>
            <div className="space-y-2">
              <Label>Asset Type *</Label>
              <Select value={assetType} onValueChange={setAssetType}>
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
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Brief description of this maintenance template"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Trigger Type *</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mileage">Mileage-Based</SelectItem>
                  <SelectItem value="time">Time-Based (Days)</SelectItem>
                  <SelectItem value="engine_hours">Engine Hours</SelectItem>
                  <SelectItem value="job_count">Job Count</SelectItem>
                  <SelectItem value="pump_hours">Pump Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trigger Interval *</Label>
              <Input
                type="number"
                value={triggerInterval}
                onChange={(e) => setTriggerInterval(e.target.value)}
                placeholder={
                  triggerType === "mileage" ? "e.g., 5000" :
                  triggerType === "time" ? "e.g., 90" :
                  triggerType === "engine_hours" ? "e.g., 250" :
                  triggerType === "job_count" ? "e.g., 100" :
                  "e.g., 500"
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estimated Cost ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated Labor (hours)</Label>
              <Input
                type="number"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="0.0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Checklist Items</Label>
              <Button size="sm" variant="outline" onClick={addChecklistItem}>
                <Plus className="w-3 h-3 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-muted/20 p-2 rounded">
                  <Input
                    placeholder="Item name"
                    value={item.item}
                    onChange={(e) => {
                      const updated = [...checklistItems];
                      updated[idx].item = e.target.value;
                      setChecklistItems(updated);
                    }}
                  />
                  <Select
                    value={item.severity}
                    onValueChange={(v) => {
                      const updated = [...checklistItems];
                      updated[idx].severity = v;
                      setChecklistItems(updated);
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== idx))}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Parts List</Label>
              <Button size="sm" variant="outline" onClick={addPart}>
                <Plus className="w-3 h-3 mr-1" />
                Add Part
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {partsList.map((part, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-muted/20 p-2 rounded">
                  <Input
                    placeholder="Part name"
                    value={part.part_name}
                    onChange={(e) => {
                      const updated = [...partsList];
                      updated[idx].part_name = e.target.value;
                      setPartsList(updated);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    className="w-20"
                    value={part.qty}
                    onChange={(e) => {
                      const updated = [...partsList];
                      updated[idx].qty = parseFloat(e.target.value) || 0;
                      setPartsList(updated);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Cost"
                    className="w-24"
                    value={part.unit_cost}
                    onChange={(e) => {
                      const updated = [...partsList];
                      updated[idx].unit_cost = parseFloat(e.target.value) || 0;
                      setPartsList(updated);
                    }}
                  />
                  <Button size="sm" variant="ghost" onClick={() => setPartsList(partsList.filter((_, i) => i !== idx))}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()}>Save Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
