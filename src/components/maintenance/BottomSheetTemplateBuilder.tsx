import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, X, Plus, GripVertical, Trash2, FileText, Upload, Camera, PenTool, Clock, Wrench, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface BottomSheetTemplateBuilderProps {
  templateId: string | null;
  isOpen: boolean;
  isCreating: boolean;
  onClose: () => void;
}

interface TemplateFormData {
  name: string;
  description: string;
  template_type: string;
  template_data: TemplateSection[];
}

interface TemplateSection {
  id: string;
  type: string;
  title: string;
  description?: string;
  required: boolean;
  order: number;
  settings?: Record<string, any>;
}

const SECTION_TYPES = [
  { 
    id: "text_input", 
    label: "Text Input", 
    description: "Single line text field",
    icon: PenTool,
    defaultSettings: { placeholder: "Enter text...", maxLength: 100 }
  },
  { 
    id: "textarea", 
    label: "Text Area", 
    description: "Multi-line text field",
    icon: FileText,
    defaultSettings: { placeholder: "Enter description...", rows: 4 }
  },
  { 
    id: "photo_capture", 
    label: "Photo Capture", 
    description: "Camera photo upload",
    icon: Camera,
    defaultSettings: { maxPhotos: 5, quality: "high" }
  },
  { 
    id: "signature", 
    label: "Digital Signature", 
    description: "Signature pad",
    icon: PenTool,
    defaultSettings: { required: true }
  },
  { 
    id: "checkbox_list", 
    label: "Checklist", 
    description: "Multiple checkboxes",
    icon: AlertTriangle,
    defaultSettings: { options: ["Item 1", "Item 2", "Item 3"] }
  },
  { 
    id: "date_time", 
    label: "Date & Time", 
    description: "Date and time picker",
    icon: Clock,
    defaultSettings: { includeTime: true }
  },
  { 
    id: "parts_list", 
    label: "Parts Used", 
    description: "Parts and materials list",
    icon: Wrench,
    defaultSettings: { allowCustom: true }
  },
  { 
    id: "file_upload", 
    label: "File Upload", 
    description: "Document upload",
    icon: Upload,
    defaultSettings: { maxFiles: 3, allowedTypes: ["pdf", "jpg", "png"] }
  }
];

export const BottomSheetTemplateBuilder: React.FC<BottomSheetTemplateBuilderProps> = ({
  templateId,
  isOpen,
  isCreating,
  onClose,
}) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: "",
    description: "",
    template_type: "maintenance",
    template_data: [],
  });

  const [selectedSectionType, setSelectedSectionType] = useState<string>("");

  // Fetch existing template data
  const { data: template } = useQuery({
    queryKey: ["maintenance-report-template", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      
      const { data, error } = await supabase
        .from("maintenance_report_templates")
        .select("*")
        .eq("id", templateId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!templateId && !isCreating,
  });

  // Load template data when available
  useEffect(() => {
    if (template && !isCreating) {
      setFormData({
        name: template.name || "",
        description: template.description || "",
        template_type: template.template_type || "maintenance",
        template_data: (template.template_data as unknown as TemplateSection[]) || [],
      });
    } else if (isCreating) {
      setFormData({
        name: "",
        description: "",
        template_type: "maintenance",
        template_data: [],
      });
    }
  }, [template, isCreating]);

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const templateData = {
        name: data.name,
        description: data.description,
        template_type: data.template_type,
        template_data: data.template_data as any,
      };

      if (isCreating) {
        const { error } = await supabase
          .from("maintenance_report_templates")
          .insert(templateData);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("maintenance_report_templates")
          .update(templateData)
          .eq("id", templateId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-report-templates"] });
      toast.success(isCreating ? "Template created successfully" : "Template updated successfully");
      onClose();
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Failed to save template");
    },
  });

  // Handle drag and drop
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const sections = Array.from(formData.template_data);
    const [reorderedSection] = sections.splice(result.source.index, 1);
    sections.splice(result.destination.index, 0, reorderedSection);

    // Update order numbers
    const updatedSections = sections.map((section, index) => ({
      ...section,
      order: index,
    }));

    setFormData(prev => ({
      ...prev,
      template_data: updatedSections,
    }));
  }, [formData.template_data]);

  // Add new section
  const addSection = useCallback(() => {
    if (!selectedSectionType) return;

    const sectionType = SECTION_TYPES.find(type => type.id === selectedSectionType);
    if (!sectionType) return;

    const newSection: TemplateSection = {
      id: `section_${Date.now()}`,
      type: selectedSectionType,
      title: sectionType.label,
      required: false,
      order: formData.template_data.length,
      settings: sectionType.defaultSettings,
    };

    setFormData(prev => ({
      ...prev,
      template_data: [...prev.template_data, newSection],
    }));

    setSelectedSectionType("");
  }, [selectedSectionType, formData.template_data.length]);

  // Remove section
  const removeSection = useCallback((sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      template_data: prev.template_data.filter(section => section.id !== sectionId),
    }));
  }, []);

  // Update section
  const updateSection = useCallback((sectionId: string, updates: Partial<TemplateSection>) => {
    setFormData(prev => ({
      ...prev,
      template_data: prev.template_data.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      ),
    }));
  }, []);

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Template name is required");
      return;
    }
    saveMutation.mutate(formData);
  };

  const getSectionIcon = (type: string) => {
    const sectionType = SECTION_TYPES.find(t => t.id === type);
    return sectionType?.icon || FileText;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-xl font-bold">
            {isCreating ? "Create Report Template" : "Edit Report Template"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
          {/* Left Panel - Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Standard Service Report"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this template's purpose..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="template_type">Template Type</Label>
              <Select 
                value={formData.template_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, template_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <Label>Add Section</Label>
              <div className="flex gap-2">
                <Select value={selectedSectionType} onValueChange={setSelectedSectionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose section type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addSection} disabled={!selectedSectionType}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Middle Panel - Template Builder */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Template Sections</Label>
            <ScrollArea className="h-full">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="template-sections">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {formData.template_data.map((section, index) => {
                        const IconComponent = getSectionIcon(section.type);
                        return (
                          <Draggable key={section.id} draggableId={section.id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-4 ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mt-1 p-1 hover:bg-gray-100 rounded cursor-grab"
                                  >
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <IconComponent className="w-4 h-4 text-blue-600" />
                                      <Input
                                        value={section.title}
                                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                        className="font-medium border-none p-0 h-auto bg-transparent"
                                      />
                                      <Badge variant={section.required ? "default" : "secondary"}>
                                        {section.required ? "Required" : "Optional"}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      {SECTION_TYPES.find(t => t.id === section.type)?.description}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSection(section.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </Card>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {formData.template_data.length === 0 && (
                <Card className="p-8 text-center border-dashed">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No sections added yet</p>
                  <p className="text-sm text-gray-500">Add sections from the left panel to build your template</p>
                </Card>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Live Preview</Label>
            <Card className="p-6 h-full overflow-y-auto">
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-bold">
                    {formData.name || "Template Preview"}
                  </h2>
                  {formData.description && (
                    <p className="text-sm text-gray-600 mt-1">{formData.description}</p>
                  )}
                </div>

                <div className="space-y-4">
                  {formData.template_data.map((section) => {
                    const IconComponent = getSectionIcon(section.type);
                    return (
                      <div key={section.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <IconComponent className="w-4 h-4 text-blue-600" />
                          <Label className="text-sm font-medium">
                            {section.title}
                            {section.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                        </div>
                        
                        {/* Preview based on section type */}
                        {section.type === "text_input" && (
                          <div className="h-10 bg-white border rounded px-3 py-2 text-sm text-gray-400">
                            {section.settings?.placeholder || "Enter text..."}
                          </div>
                        )}
                        {section.type === "textarea" && (
                          <div className="h-20 bg-white border rounded px-3 py-2 text-sm text-gray-400">
                            {section.settings?.placeholder || "Enter description..."}
                          </div>
                        )}
                        {section.type === "photo_capture" && (
                          <div className="h-24 bg-white border-2 border-dashed rounded flex items-center justify-center">
                            <div className="text-center text-gray-400">
                              <Camera className="w-6 h-6 mx-auto mb-1" />
                              <span className="text-xs">Click to capture photo</span>
                            </div>
                          </div>
                        )}
                        {section.type === "signature" && (
                          <div className="h-24 bg-white border rounded flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <PenTool className="w-6 h-6 mx-auto mb-1" />
                              <span className="text-xs">Sign here</span>
                            </div>
                          </div>
                        )}
                        {section.type === "checkbox_list" && (
                          <div className="space-y-2">
                            {(section.settings?.options || ["Item 1", "Item 2"]).map((option: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="w-4 h-4 border rounded"></div>
                                <span className="text-sm">{option}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {(section.type === "date_time" || section.type === "parts_list" || section.type === "file_upload") && (
                          <div className="h-10 bg-white border rounded px-3 py-2 flex items-center text-sm text-gray-400">
                            {section.type === "date_time" && "Select date and time..."}
                            {section.type === "parts_list" && "Add parts and materials..."}
                            {section.type === "file_upload" && "Click to upload files..."}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {formData.template_data.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Add sections to see preview</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending || !formData.name.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};