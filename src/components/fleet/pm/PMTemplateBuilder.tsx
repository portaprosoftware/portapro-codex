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
  const [category, setCategory] = useState("pump_truck");
  const [instructions, setInstructions] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [triggers, setTriggers] = useState<Record<string, string>>({});
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [partsList, setPartsList] = useState<any[]>([]);

  useEffect(() => {
    if (template) {
      setName(template.name || "");
      setCategory(template.category || "pump_truck");
      setInstructions(template.instructions || "");
      setEstimatedHours(template.estimated_labor_hours?.toString() || "");
      setTriggers(template.default_triggers || {});
      setChecklistItems(template.checklist || []);
      setPartsList(template.parts_list || []);
    } else {
      reset();
    }
  }, [template, open]);

  const reset = () => {
    setName("");
    setCategory("pump_truck");
    setInstructions("");
    setEstimatedHours("");
    setTriggers({});
    setChecklistItems([]);
    setPartsList([]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        name,
        category,
        instructions,
        estimated_labor_hours: estimatedHours ? parseFloat(estimatedHours) : null,
        default_triggers: triggers,
        checklist: checklistItems,
        parts_list: partsList
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
              <Label>Template Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Pump Truck - 5K Service" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pump_truck">Pump Truck</SelectItem>
                  <SelectItem value="trailer">Trailer</SelectItem>
                  <SelectItem value="generator">Generator</SelectItem>
                  <SelectItem value="unit">Unit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Triggers</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                placeholder="Miles"
                value={triggers.miles || ""}
                onChange={(e) => setTriggers({ ...triggers, miles: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Engine Hours"
                value={triggers.hours || ""}
                onChange={(e) => setTriggers({ ...triggers, hours: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Days"
                value={triggers.days || ""}
                onChange={(e) => setTriggers({ ...triggers, days: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Job Count"
                value={triggers.job_count || ""}
                onChange={(e) => setTriggers({ ...triggers, job_count: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Pump Hours"
                value={triggers.pump_hours || ""}
                onChange={(e) => setTriggers({ ...triggers, pump_hours: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Est. Labor (hrs)"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Instructions</Label>
            <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} />
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
