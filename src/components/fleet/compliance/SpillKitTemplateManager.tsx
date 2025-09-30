import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Package, Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type SpillKitTemplate = {
  id: string;
  name: string;
  description: string;
  vehicle_types: string[];
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  items?: TemplateItem[];
};

type TemplateItem = {
  id: string;
  item_name: string;
  required_quantity: number;
  critical_item: boolean;
  category: string;
  expiration_trackable: boolean;
  display_order: number;
};

export const SpillKitTemplateManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<SpillKitTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["spill-kit-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spill_kit_templates")
        .select(`
          *,
          spill_kit_template_items(*)
        `)
        .order("name");
      if (error) throw error;
      return data.map(template => ({
        ...template,
        items: template.spill_kit_template_items || []
      }));
    }
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("spill_kit_templates")
        .delete()
        .eq("id", templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Template deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["spill-kit-templates"] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Toggle default template mutation
  const toggleDefaultMutation = useMutation({
    mutationFn: async ({ templateId, isDefault }: { templateId: string; isDefault: boolean }) => {
      if (isDefault) {
        // Check if there's already a default template
        const currentDefault = templates?.find(t => t.is_default && t.id !== templateId);
        if (currentDefault) {
          throw new Error(`Cannot set as default. "${currentDefault.name}" is already the default template. Remove default from that template first.`);
        }
        
        // Set this one as default
        const { error } = await supabase
          .from("spill_kit_templates")
          .update({ is_default: true })
          .eq("id", templateId);
        if (error) throw error;
      } else {
        // Remove default status
        const { error } = await supabase
          .from("spill_kit_templates")
          .update({ is_default: false })
          .eq("id", templateId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Default template updated" });
      queryClient.invalidateQueries({ queryKey: ["spill-kit-templates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Cannot set as default",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const openEditDialog = (template?: SpillKitTemplate) => {
    setEditingTemplate(template || null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Spill Kit Templates</h2>
          <p className="text-muted-foreground">
            Manage standardized spill kit configurations for different vehicle types
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => openEditDialog()}
              variant="outline"
              className="h-10 bg-gray-50 hover:bg-gray-100 border-gray-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create New Template"}
              </DialogTitle>
            </DialogHeader>
            <TemplateForm 
              template={editingTemplate} 
              onClose={closeDialog}
              onSaved={() => {
                queryClient.invalidateQueries({ queryKey: ["spill-kit-templates"] });
                closeDialog();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5" />
                    {template.name}
                    {template.is_default && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vehicle Types */}
              <div>
                <label className="text-sm font-medium mb-2 block">Vehicle Types</label>
                <div className="flex flex-wrap gap-1">
                  {template.vehicle_types.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Items Summary */}
              <div>
                <label className="text-sm font-medium mb-2 block">Items Summary</label>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Items:</span>
                    <span className="font-medium">{template.items?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Critical Items:</span>
                    <span className="font-medium text-red-600">
                      {template.items?.filter(item => item.critical_item).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Categories:</span>
                    <span className="font-medium">
                      {new Set(template.items?.map(item => item.category)).size || 0}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <Label htmlFor={`default-${template.id}`} className="text-sm font-medium cursor-pointer">
                    Set as default template
                  </Label>
                  <Switch
                    id={`default-${template.id}`}
                    checked={template.is_default}
                    onCheckedChange={(checked) => 
                      toggleDefaultMutation.mutate({ templateId: template.id, isDefault: checked })
                    }
                    disabled={toggleDefaultMutation.isPending}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(template)}
                  className="w-full"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates?.length === 0 && (
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Templates Found</h3>
          <p className="text-muted-foreground mb-4">
            Create your first spill kit template to standardize inspections.
          </p>
          <Button onClick={() => openEditDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </Card>
      )}
    </div>
  );
};

// Template Form Component
const TemplateForm: React.FC<{
  template?: SpillKitTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ template, onClose, onSaved }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: template?.name || "",
    description: template?.description || "",
    vehicle_types: template?.vehicle_types || [],
    is_default: template?.is_default || false
  });
  const [items, setItems] = useState<Partial<TemplateItem>[]>(
    template?.items || [
      { item_name: "", required_quantity: 1, critical_item: false, category: "absorbents", expiration_trackable: false }
    ]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Check if trying to set as default when another template is already default
      if (formData.is_default && !template?.is_default) {
        const { data: existingDefault } = await supabase
          .from("spill_kit_templates")
          .select("id, name")
          .eq("is_default", true)
          .neq("id", template?.id || "")
          .single();
        
        if (existingDefault) {
          throw new Error(`Cannot set as default. "${existingDefault.name}" is already the default template. Remove default from that template first.`);
        }
      }
      
      // Save template
      const templateData = {
        ...formData,
        vehicle_types: formData.vehicle_types
      };

      let templateId = template?.id;

      if (template) {
        const { error } = await supabase
          .from("spill_kit_templates")
          .update(templateData)
          .eq("id", template.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("spill_kit_templates")
          .insert(templateData)
          .select()
          .single();
        if (error) throw error;
        templateId = data.id;
      }

      // Delete existing items if editing
      if (template) {
        await supabase
          .from("spill_kit_template_items")
          .delete()
          .eq("template_id", template.id);
      }

      // Save items
      const itemsData = items
        .filter(item => item.item_name)
        .map((item, index) => ({
          template_id: templateId,
          item_name: item.item_name!,
          required_quantity: item.required_quantity || 1,
          critical_item: item.critical_item || false,
          category: item.category || "general",
          expiration_trackable: item.expiration_trackable || false,
          display_order: index
        }));

      if (itemsData.length > 0) {
        const { error } = await supabase
          .from("spill_kit_template_items")
          .insert(itemsData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ 
        title: template ? "Template updated" : "Template created",
        description: "Spill kit template saved successfully."
      });
      onSaved();
    },
    onError: (error) => {
      toast({
        title: "Error saving template",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const addItem = () => {
    setItems([...items, {
      item_name: "",
      required_quantity: 1,
      critical_item: false,
      category: "absorbents",
      expiration_trackable: false
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof TemplateItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const vehicleTypeOptions = ['truck', 'van', 'trailer', 'pickup', 'suv', 'sedan'];
  const categoryOptions = ['absorbents', 'ppe', 'disposal', 'documentation', 'tools', 'general'];

  return (
    <div className="space-y-6">
      {/* Template Details */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Template Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Standard DOT Spill Kit"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe this template's purpose and use cases..."
            rows={2}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Vehicle Types</label>
          <div className="grid grid-cols-3 gap-2">
            {vehicleTypeOptions.map(type => (
              <label key={type} className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.vehicle_types.includes(type)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({
                        ...prev,
                        vehicle_types: [...prev.vehicle_types, type]
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        vehicle_types: prev.vehicle_types.filter(t => t !== type)
                      }));
                    }
                  }}
                />
                <span className="text-sm capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
          <Label htmlFor="form-default" className="text-sm font-medium cursor-pointer">
            Set as default template
          </Label>
          <Switch
            id="form-default"
            checked={formData.is_default}
            onCheckedChange={(checked) => 
              setFormData(prev => ({ ...prev, is_default: !!checked }))
            }
          />
        </div>
      </div>

      <Separator />

      {/* Template Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Template Items</h3>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <Card key={index} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Item Name</label>
                  <Input
                    value={item.item_name || ""}
                    onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                    placeholder="e.g., Absorbent Pads"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Quantity</label>
                  <Input
                    type="number"
                    value={item.required_quantity || 1}
                    onChange={(e) => updateItem(index, 'required_quantity', parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <Select
                    value={item.category || "absorbents"}
                    onValueChange={(value) => updateItem(index, 'category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={item.critical_item || false}
                      onCheckedChange={(checked) => updateItem(index, 'critical_item', !!checked)}
                    />
                    <span className="text-sm">Critical Item</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={item.expiration_trackable || false}
                      onCheckedChange={(checked) => updateItem(index, 'expiration_trackable', !!checked)}
                    />
                    <span className="text-sm">Track Expiration</span>
                  </label>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={() => saveMutation.mutate()}
          disabled={!formData.name || items.filter(i => i.item_name).length === 0 || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            template ? 'Update Template' : 'Create Template'
          )}
        </Button>
      </div>
    </div>
  );
};