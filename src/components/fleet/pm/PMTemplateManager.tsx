import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PMTemplateBuilder } from "./PMTemplateBuilder";

interface PMTemplate {
  id: string;
  name: string;
  category: string;
  default_triggers: any;
  instructions: string;
  checklist: any[];
  parts_list: any[];
  estimated_labor_hours: number;
  is_active: boolean;
}

export const PMTemplateManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PMTemplate | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['pm-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pm_templates' as any)
        .select('*')
        .order('category', { ascending: true });
      if (error) throw error;
      return (data || []) as any as PMTemplate[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pm_templates' as any)
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-templates'] });
      toast({ title: "Template deactivated" });
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template: PMTemplate) => {
      const { error } = await supabase
        .from('pm_templates' as any)
        .insert({
          name: `${template.name} (Copy)`,
          category: template.category,
          default_triggers: template.default_triggers,
          instructions: template.instructions,
          checklist: template.checklist,
          parts_list: template.parts_list,
          estimated_labor_hours: template.estimated_labor_hours
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm-templates'] });
      toast({ title: "Template duplicated" });
    }
  });

  const categoryColors: Record<string, string> = {
    pump_truck: 'bg-blue-500',
    trailer: 'bg-purple-500',
    generator: 'bg-orange-500',
    unit: 'bg-green-500'
  };

  const categoryLabels: Record<string, string> = {
    pump_truck: 'Pump Truck',
    trailer: 'Trailer',
    generator: 'Generator',
    unit: 'Unit'
  };

  if (isLoading) {
    return <div className="p-6">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">PM Templates</h2>
          <p className="text-sm text-muted-foreground">Create reusable preventive maintenance checklists</p>
        </div>
        <Button onClick={() => { setEditingTemplate(null); setBuilderOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates?.filter(t => t.is_active).map(template => (
          <Card key={template.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">{template.name}</h3>
                <Badge className={`${categoryColors[template.category]} text-white`}>
                  {categoryLabels[template.category] || template.category}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">{template.checklist?.length || 0}</span> checklist items
              </div>
              <div>
                <span className="font-medium">{template.parts_list?.length || 0}</span> parts
              </div>
              {template.estimated_labor_hours && (
                <div>
                  Est. <span className="font-medium">{template.estimated_labor_hours}h</span> labor
                </div>
              )}
              {template.default_triggers && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(template.default_triggers).map(([key, value]) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {key}: {String(value)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button size="sm" variant="outline" onClick={() => { setEditingTemplate(template); setBuilderOpen(true); }}>
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => duplicateMutation.mutate(template)}>
                <Copy className="w-3 h-3 mr-1" />
                Duplicate
              </Button>
              <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(template.id)}>
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <PMTemplateBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        template={editingTemplate}
      />
    </div>
  );
};
