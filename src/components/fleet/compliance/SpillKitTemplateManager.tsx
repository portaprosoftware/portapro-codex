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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Edit, Trash2, Package, Shield, Clock, Car, Info, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VehicleTypesMultiSelector } from "./VehicleTypesMultiSelector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SpillKitTypeSelectionModal } from "./SpillKitTypeSelectionModal";

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
          <h2 className="text-xl font-semibold">Spill Kit Templates</h2>
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
              templates={templates}
              onClose={closeDialog}
              onSaved={() => {
                queryClient.invalidateQueries({ queryKey: ["spill-kit-templates"] });
                closeDialog();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates List */}
      <div className="space-y-3">
        {templates?.map((template) => (
          <Card key={template.id} className="relative">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {/* Left: Template Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">{template.name}</h3>
                      {template.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Vehicle Types */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Vehicle Types</label>
                      <div className="flex flex-wrap gap-1">
                        {template.vehicle_types.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Items Summary</label>
                      <div className="flex gap-6">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Total</span>
                          <span className="text-sm font-medium">{template.items?.length || 0}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Critical</span>
                          <span className="text-sm font-medium text-red-600">
                            {template.items?.filter(item => item.critical_item).length || 0}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Categories</span>
                          <span className="text-sm font-medium">
                            {new Set(template.items?.map(item => item.category)).size || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(template)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Template
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteMutation.mutate(template.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Template
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
  templates?: SpillKitTemplate[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ template, templates, onClose, onSaved }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: template?.name || "",
    description: template?.description || "",
    vehicle_types: template?.vehicle_types || [],
    is_default: template?.is_default || false
  });
  const [items, setItems] = useState<Partial<TemplateItem>[]>(
    template?.items || [
      { item_name: "", required_quantity: 1, critical_item: false, category: "absorbent", expiration_trackable: false }
    ]
  );
  const [vehicleSelectorOpen, setVehicleSelectorOpen] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // Check if there's another template that's already set as default
  const otherDefaultTemplate = templates?.find(t => t.is_default && t.id !== template?.id);
  const canSetAsDefault = !otherDefaultTemplate || template?.is_default;

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
      category: "absorbent",
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

  const handleOpenTypeModal = (index: number) => {
    setEditingItemIndex(index);
    setTypeModalOpen(true);
  };

  const handleSelectType = (type: string) => {
    if (editingItemIndex !== null) {
      updateItem(editingItemIndex, 'category', type);
    }
    setTypeModalOpen(false);
    setEditingItemIndex(null);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'absorbent': 'Absorbents',
      'containment': 'Containment & Control',
      'ppe': 'PPE',
      'decon': 'Decon & Cleaning',
      'tools': 'Tools & Hardware',
      'disposal': 'Disposal & Packaging',
      'documentation': 'Documentation & Labels',
      'pump_transfer': 'Pump / Transfer',
      'signage': 'Signage & Safety',
      'other': 'General / Other'
    };
    return labels[category] || category;
  };

  const vehicleTypeOptions = ['truck', 'van', 'trailer', 'pickup', 'suv', 'sedan'];

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
          <Button 
            type="button"
            variant="outline" 
            className="w-full justify-start h-auto py-3 flex-col items-start gap-2"
            onClick={() => setVehicleSelectorOpen(true)}
          >
            <div className="flex items-center w-full">
              <Car className="w-4 h-4 mr-2 flex-shrink-0" />
              {formData.vehicle_types.length > 0 ? (
                <div className="flex flex-wrap gap-1 flex-1">
                  {formData.vehicle_types.map(type => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">No vehicle types selected</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Select to add/remove existing vehicle type(s)
            </span>
          </Button>
          
          <VehicleTypesMultiSelector
            open={vehicleSelectorOpen}
            onOpenChange={setVehicleSelectorOpen}
            selectedTypes={formData.vehicle_types}
            onSelectionChange={(types) => setFormData(prev => ({ ...prev, vehicle_types: types }))}
          />
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Label htmlFor="form-default" className="text-sm font-medium cursor-pointer">
              Set as default template
            </Label>
            {!canSetAsDefault && (
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Only one default template allowed</p>
                    <p className="text-sm text-muted-foreground">
                      Only one template can be set as default. To make this one the default, first unmark the current default template "{otherDefaultTemplate?.name}", then return here.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <Switch
            id="form-default"
            checked={formData.is_default}
            disabled={!canSetAsDefault}
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenTypeModal(index)}
                    className="w-full justify-start text-left font-normal"
                  >
                    {getCategoryLabel(item.category || "absorbent")}
                  </Button>
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

      {/* Spill Kit Type Selection Modal */}
      <SpillKitTypeSelectionModal
        isOpen={typeModalOpen}
        onClose={() => {
          setTypeModalOpen(false);
          setEditingItemIndex(null);
        }}
        onSelect={handleSelectType}
        currentValue={editingItemIndex !== null ? items[editingItemIndex]?.category : undefined}
      />
    </div>
  );
};