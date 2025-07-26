import React, { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from 'react-beautiful-dnd';
import {
  FileText,
  Users,
  Clipboard,
  Truck,
  CheckSquare,
  Package,
  Clock,
  Camera,
  PenTool,
  Plus,
  GripVertical,
  Settings,
  Trash2,
  Eye,
  History,
  Download
} from 'lucide-react';
import { SectionSettingsPanel } from './SectionSettingsPanel';
import { TemplateVersioningModal } from './TemplateVersioningModal';
import { EnhancedPDFGenerator } from './EnhancedPDFGenerator';

interface TemplateEditModalProps {
  templateId: string | null;
  isOpen: boolean;
  isCreating: boolean;
  onClose: () => void;
}

interface TemplateFormData {
  name: string;
  description: string;
  template_type: string;
  page_size: string;
  orientation: string;
  company_logo_url: string;
  color_accent: string;
  category: string;
}

interface SectionType {
  id: string;
  name: string;
  display_name: string;
  category: string;
  icon: string;
  description: string;
  default_settings: any;
}

interface TemplateSection {
  id?: string;
  section_type: string;
  position: number;
  settings: any;
  is_active: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  FileText,
  Users,
  Clipboard,
  Truck,
  CheckSquare,
  Package,
  Clock,
  Camera,
  PenTool,
};

const getIcon = (iconName: string) => {
  return iconMap[iconName] || FileText;
};

export const EnhancedTemplateEditModal: React.FC<TemplateEditModalProps> = ({
  templateId,
  isOpen,
  isCreating,
  onClose
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    template_type: 'maintenance',
    page_size: 'letter',
    orientation: 'portrait',
    company_logo_url: '',
    color_accent: '#3B82F6',
    category: 'general'
  });

  const [templateSections, setTemplateSections] = useState<TemplateSection[]>([]);

  // Fetch section types
  const { data: sectionTypes = [] } = useQuery({
    queryKey: ['section-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('section_types')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as SectionType[];
    }
  });

  // Fetch template data if editing
  const { data: templateData } = useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      if (!templateId || isCreating) return null;
      
      const { data, error } = await supabase
        .from('maintenance_report_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!templateId && !isCreating
  });

  // Fetch template sections if editing
  const { data: existingSections = [] } = useQuery({
    queryKey: ['template-sections', templateId],
    queryFn: async () => {
      if (!templateId || isCreating) return [];
      
      const { data, error } = await supabase
        .from('template_sections')
        .select('*')
        .eq('template_id', templateId)
        .eq('is_active', true)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as TemplateSection[];
    },
    enabled: !!templateId && !isCreating
  });

  // Populate form when editing
  useEffect(() => {
    if (templateData) {
      setFormData({
        name: templateData.name || '',
        description: templateData.description || '',
        template_type: templateData.template_type || 'maintenance',
        page_size: (templateData as any).page_size || 'letter',
        orientation: (templateData as any).orientation || 'portrait',
        company_logo_url: (templateData as any).company_logo_url || '',
        color_accent: (templateData as any).color_accent || '#3B82F6',
        category: (templateData as any).category || 'general'
      });
    }
  }, [templateData]);

  // Populate sections when editing
  useEffect(() => {
    if (existingSections.length > 0) {
      setTemplateSections(existingSections);
    }
  }, [existingSections]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: TemplateFormData & { sections: TemplateSection[] }) => {
      if (isCreating) {
        // Create new template
        const { data: newTemplate, error: templateError } = await supabase
          .from('maintenance_report_templates')
          .insert({
            name: data.name,
            description: data.description,
            template_type: data.template_type,
            page_size: data.page_size,
            orientation: data.orientation,
            company_logo_url: data.company_logo_url,
            color_accent: data.color_accent,
            category: data.category,
            template_data: {} // Legacy field
          })
          .select()
          .single();

        if (templateError) throw templateError;

        // Create sections
        if (data.sections.length > 0) {
          const sectionsData = data.sections.map((section, index) => ({
            template_id: newTemplate.id,
            section_type: section.section_type,
            position: index,
            settings: section.settings,
            is_active: true
          }));

          const { error: sectionsError } = await supabase
            .from('template_sections')
            .insert(sectionsData);

          if (sectionsError) throw sectionsError;
        }

        return newTemplate;
      } else {
        // Update existing template
        const { data: updatedTemplate, error: templateError } = await supabase
          .from('maintenance_report_templates')
          .update({
            name: data.name,
            description: data.description,
            template_type: data.template_type,
            page_size: data.page_size,
            orientation: data.orientation,
            company_logo_url: data.company_logo_url,
            color_accent: data.color_accent,
            category: data.category
          })
          .eq('id', templateId)
          .select()
          .single();

        if (templateError) throw templateError;

        // Delete existing sections
        await supabase
          .from('template_sections')
          .delete()
          .eq('template_id', templateId);

        // Insert new sections
        if (data.sections.length > 0) {
          const sectionsData = data.sections.map((section, index) => ({
            template_id: templateId!,
            section_type: section.section_type,
            position: index,
            settings: section.settings,
            is_active: true
          }));

          const { error: sectionsError } = await supabase
            .from('template_sections')
            .insert(sectionsData);

          if (sectionsError) throw sectionsError;
        }

        return updatedTemplate;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-report-templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      queryClient.invalidateQueries({ queryKey: ['template-sections', templateId] });
      toast({
        title: 'Success',
        description: `Template ${isCreating ? 'created' : 'updated'} successfully`
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${isCreating ? 'create' : 'update'} template: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ ...formData, sections: templateSections });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === 'available-sections' && destination.droppableId === 'template-sections') {
      // Add section from available to template
      const sectionType = sectionTypes.find(st => st.id === result.draggableId);
      if (sectionType) {
        const newSection: TemplateSection = {
          section_type: sectionType.name,
          position: destination.index,
          settings: sectionType.default_settings,
          is_active: true
        };

        const newSections = [...templateSections];
        newSections.splice(destination.index, 0, newSection);
        
        // Update positions
        newSections.forEach((section, index) => {
          section.position = index;
        });

        setTemplateSections(newSections);
      }
    } else if (source.droppableId === 'template-sections' && destination.droppableId === 'template-sections') {
      // Reorder sections within template
      const newSections = Array.from(templateSections);
      const [reorderedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, reorderedSection);
      
      // Update positions
      newSections.forEach((section, index) => {
        section.position = index;
      });

      setTemplateSections(newSections);
    }
  };

  const removeSection = (index: number) => {
    const newSections = templateSections.filter((_, i) => i !== index);
    newSections.forEach((section, i) => {
      section.position = i;
    });
    setTemplateSections(newSections);
  };

  // Group section types by category
  const groupedSectionTypes = sectionTypes.reduce((acc, sectionType) => {
    if (!acc[sectionType.category]) {
      acc[sectionType.category] = [];
    }
    acc[sectionType.category].push(sectionType);
    return acc;
  }, {} as Record<string, SectionType[]>);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[90vw] md:w-[80vw] lg:w-[70vw] max-w-none p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>
              {isCreating ? 'Create New Template' : 'Edit Template'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
              {/* Left Panel - Template Settings and Available Sections */}
              <div className="flex flex-col border-r overflow-hidden">
                {/* Template Settings */}
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold mb-4">Template Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Template Name</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter template name"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of the template"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Page Size</label>
                        <Select
                          value={formData.page_size}
                          onValueChange={(value) => setFormData({ ...formData, page_size: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="letter">Letter</SelectItem>
                            <SelectItem value="a4">A4</SelectItem>
                            <SelectItem value="legal">Legal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Orientation</label>
                        <Select
                          value={formData.orientation}
                          onValueChange={(value) => setFormData({ ...formData, orientation: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portrait">Portrait</SelectItem>
                            <SelectItem value="landscape">Landscape</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Accent Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={formData.color_accent}
                          onChange={(e) => setFormData({ ...formData, color_accent: e.target.value })}
                          className="h-10 w-20 rounded border border-border"
                        />
                        <Input
                          value={formData.color_accent}
                          onChange={(e) => setFormData({ ...formData, color_accent: e.target.value })}
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Available Sections */}
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                  <h3 className="text-lg font-semibold mb-2">Available Sections</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag sections from here to add them to your template
                  </p>
                  
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="space-y-4 pr-4">
                        <DragDropContext onDragEnd={handleDragEnd}>
                          <Droppable droppableId="available-sections" isDropDisabled>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                                {Object.entries(groupedSectionTypes).map(([category, sections]) => (
                                  <div key={category}>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-2">{category}</h4>
                                    <div className="space-y-2">
                                      {sections.map((sectionType, index) => {
                                        const IconComponent = getIcon(sectionType.icon);
                                        return (
                                          <Draggable
                                            key={sectionType.id}
                                            draggableId={sectionType.id}
                                            index={index}
                                          >
                                            {(provided, snapshot) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-grab transition-colors ${
                                                  snapshot.isDragging ? 'shadow-lg bg-accent' : ''
                                                }`}
                                              >
                                                <div className="flex items-center space-x-3">
                                                  <IconComponent className="h-4 w-4 text-primary" />
                                                  <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                      {sectionType.display_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                      {sectionType.description}
                                                    </p>
                                                  </div>
                                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                              </div>
                                            )}
                                          </Draggable>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </DragDropContext>
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>

              {/* Right Panel - Template Builder & Preview */}
              <div className="flex flex-col overflow-hidden">
                {/* Template Sections */}
                <div className="flex-1 p-6 border-b overflow-hidden">
                  <h3 className="text-lg font-semibold mb-2">Template Sections</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag sections here and reorder as needed
                  </p>
                  
                  <div className="h-full overflow-hidden">
                    <ScrollArea className="h-full">
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="template-sections">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`min-h-[200px] space-y-2 p-4 rounded-lg border-2 border-dashed transition-colors ${
                                snapshot.isDraggingOver 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-muted'
                              }`}
                            >
                              {templateSections.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p>Drag sections here to build your template</p>
                                </div>
                              )}
                              
                              {templateSections.map((section, index) => {
                                const sectionType = sectionTypes.find(st => st.name === section.section_type);
                                if (!sectionType) return null;
                                
                                const IconComponent = getIcon(sectionType.icon);
                                
                                return (
                                  <Draggable
                                    key={`${section.section_type}-${index}`}
                                    draggableId={`${section.section_type}-${index}`}
                                    index={index}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${
                                          snapshot.isDragging ? 'shadow-lg bg-accent' : ''
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-3">
                                            <div
                                              {...provided.dragHandleProps}
                                              className="cursor-grab hover:cursor-grabbing"
                                            >
                                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <IconComponent className="h-4 w-4 text-primary" />
                                            <div>
                                              <p className="text-sm font-medium">
                                                {sectionType.display_name}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {sectionType.description}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeSection(index)}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </ScrollArea>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>Live Preview</span>
                  </h3>
                  
                  <div 
                    className="bg-white border rounded-lg p-6 shadow-sm"
                    style={{ 
                      aspectRatio: formData.orientation === 'portrait' ? '8.5/11' : '11/8.5',
                      maxHeight: '300px',
                      overflow: 'auto'
                    }}
                  >
                    <div className="space-y-4 text-sm">
                      <div className="text-center pb-4 border-b">
                        <h3 className="font-bold text-lg" style={{ color: formData.color_accent }}>
                          {formData.name || 'Template Preview'}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {formData.description || 'Template description will appear here'}
                        </p>
                      </div>
                      
                      {templateSections.map((section, index) => {
                        const sectionType = sectionTypes.find(st => st.name === section.section_type);
                        if (!sectionType) return null;
                        
                        return (
                          <div key={index} className="py-2 border-b border-gray-100 last:border-0">
                            <h4 className="font-medium text-gray-800 mb-1">
                              {sectionType.display_name}
                            </h4>
                            <p className="text-gray-500 text-xs">
                              {sectionType.description}
                            </p>
                          </div>
                        );
                      })}
                      
                      {templateSections.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <p>Add sections to see preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-3 p-6 border-t bg-background">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};