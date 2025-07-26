import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown, FileText, Search, X, Eye, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceTemplate {
  id: string;
  name: string;
  description?: string;
  template_code: string;
  template_type: string;
  is_public: boolean;
  is_active: boolean;
  version: number;
  created_at: string;
}

interface ServiceTemplateAssignmentData {
  selectedTemplateIds: string[];
  defaultTemplateId?: string;
  availableTemplates: MaintenanceTemplate[];
  preSelectedFromServices: string[];
}

interface ServiceTemplateAssignmentStepProps {
  data: ServiceTemplateAssignmentData;
  onUpdate: (data: ServiceTemplateAssignmentData) => void;
  selectedServices: any[]; // From previous step
}

export const ServiceTemplateAssignmentStep: React.FC<ServiceTemplateAssignmentStepProps> = ({
  data,
  onUpdate,
  selectedServices
}) => {
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<MaintenanceTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    // Auto-detect templates based on selected services
    detectTemplatesFromServices();
  }, [selectedServices, data.availableTemplates]);

  const fetchTemplates = async () => {
    try {
      const { data: templatesData, error } = await supabase
        .from('maintenance_report_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const templates = (templatesData || []).map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        template_code: `TPL-${template.id.slice(0, 8).toUpperCase()}`,
        template_type: template.template_type,
        is_public: template.is_public,
        is_active: template.is_active,
        version: template.current_version || 1,
        created_at: template.created_at
      }));

      onUpdate({
        ...data,
        availableTemplates: templates
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      onUpdate({
        ...data,
        availableTemplates: []
      });
    } finally {
      setLoading(false);
    }
  };

  const detectTemplatesFromServices = () => {
    if (!selectedServices || selectedServices.length === 0 || !data.availableTemplates) {
      return;
    }

    // Get service IDs that have default templates
    const serviceIds = selectedServices.map(s => s.id);
    
    // For each service, check if it has a default_template_id
    // This would require a join query in a real implementation
    // For now, we'll simulate smart detection based on service types
    const autoDetectedTemplateIds: string[] = [];
    
    selectedServices.forEach(service => {
      // Smart matching based on service name/type
      const matchingTemplate = data.availableTemplates.find(template => 
        template.name.toLowerCase().includes(service.name.toLowerCase().split(' ')[0]) ||
        template.template_type.toLowerCase() === service.name.toLowerCase() ||
        (template.description && template.description.toLowerCase().includes(service.name.toLowerCase()))
      );
      
      if (matchingTemplate && !autoDetectedTemplateIds.includes(matchingTemplate.id)) {
        autoDetectedTemplateIds.push(matchingTemplate.id);
      }
    });

    // Add "Standard Service Report" as default if no specific templates found
    const standardTemplate = data.availableTemplates.find(t => 
      t.name.toLowerCase().includes('standard') || 
      t.template_type === 'standard' ||
      t.template_code === 'STANDARD'
    );

    if (standardTemplate && autoDetectedTemplateIds.length === 0) {
      autoDetectedTemplateIds.push(standardTemplate.id);
    }

    // Update with auto-detected templates if none are selected yet
    if (data.selectedTemplateIds.length === 0 && autoDetectedTemplateIds.length > 0) {
      onUpdate({
        ...data,
        selectedTemplateIds: autoDetectedTemplateIds,
        defaultTemplateId: autoDetectedTemplateIds[0],
        preSelectedFromServices: autoDetectedTemplateIds
      });
    }
  };

  const toggleTemplate = (templateId: string) => {
    const isSelected = data.selectedTemplateIds.includes(templateId);
    
    if (isSelected) {
      // Remove template
      const newSelectedIds = data.selectedTemplateIds.filter(id => id !== templateId);
      const newDefaultId = data.defaultTemplateId === templateId 
        ? newSelectedIds[0] || undefined 
        : data.defaultTemplateId;

      onUpdate({
        ...data,
        selectedTemplateIds: newSelectedIds,
        defaultTemplateId: newDefaultId
      });
    } else {
      // Add template
      const newSelectedIds = [...data.selectedTemplateIds, templateId];
      const newDefaultId = data.defaultTemplateId || templateId;

      onUpdate({
        ...data,
        selectedTemplateIds: newSelectedIds,
        defaultTemplateId: newDefaultId
      });
    }
  };

  const setAsDefault = (templateId: string) => {
    onUpdate({
      ...data,
      defaultTemplateId: templateId
    });
  };

  const getSelectedTemplates = () => {
    return data.availableTemplates.filter(t => data.selectedTemplateIds.includes(t.id));
  };

  const getFilteredTemplates = () => {
    return data.availableTemplates.filter(template =>
      template.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchValue.toLowerCase())) ||
      (template.template_code && template.template_code.toLowerCase().includes(searchValue.toLowerCase()))
    );
  };

  const getTemplateTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cleaning':
      case 'cleaning_log':
        return '🧹';
      case 'inspection':
        return '🔍';
      case 'maintenance':
        return '🔧';
      case 'repair':
      case 'repair_report':
        return '⚙️';
      default:
        return '📋';
    }
  };

  const getTemplatePreview = (template: MaintenanceTemplate) => {
    return (
      <div className="text-xs text-muted-foreground space-y-1">
        <div>Type: {template.template_type}</div>
        {template.template_code && <div>Code: {template.template_code}</div>}
        <div>Version: {template.version}</div>
        <div>Created: {new Date(template.created_at).toLocaleDateString()}</div>
      </div>
    );
  };

  const selectedTemplates = getSelectedTemplates();

  if (loading) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading service templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Service Report Templates</h2>
        <p className="text-muted-foreground">
          Assign report templates that drivers will complete when starting this job
        </p>
      </div>

      {/* Auto-detected Templates Notice */}
      {data.preSelectedFromServices.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center space-x-2">
              <Star className="w-5 h-5" />
              <span>Smart Template Detection</span>
            </CardTitle>
            <CardDescription className="text-blue-700">
              Based on your selected services, we've automatically suggested {data.preSelectedFromServices.length} 
              {data.preSelectedFromServices.length === 1 ? ' template' : ' templates'}. You can modify or add more below.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Template Search & Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Add Templates</span>
          </CardTitle>
          <CardDescription>
            Search and select templates for this job. Drivers will fill these out when they start the job.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={searchOpen}
                className="w-full justify-between"
              >
                <span className="flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span>Search templates...</span>
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search templates by name, type, or code..." 
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty>No templates found.</CommandEmpty>
                  <CommandGroup>
                    {getFilteredTemplates().map((template) => (
                      <CommandItem
                        key={template.id}
                        value={template.id}
                        onSelect={() => {
                          toggleTemplate(template.id);
                          setSearchOpen(false);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{getTemplateTypeIcon(template.template_type)}</span>
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {template.template_code && `${template.template_code} • `}
                                {template.template_type}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {data.selectedTemplateIds.includes(template.id) && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTemplate(template);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Selected Templates */}
      {selectedTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Selected Templates ({selectedTemplates.length})</span>
              </span>
            </CardTitle>
            <CardDescription>
              Templates assigned to this job. Drivers will complete these when starting the job.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedTemplates.map((template) => (
                <div
                  key={template.id}
                  className={cn(
                    "p-4 border rounded-lg",
                    data.defaultTemplateId === template.id && "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getTemplateTypeIcon(template.template_type)}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{template.name}</span>
                          {data.defaultTemplateId === template.id && (
                            <Badge className="bg-primary text-primary-foreground">
                              Primary
                            </Badge>
                          )}
                          {data.preSelectedFromServices.includes(template.id) && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Auto-detected
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </div>
                        <div className="flex items-center space-x-3 mt-2">
                          {template.template_code && (
                            <Badge variant="outline">{template.template_code}</Badge>
                          )}
                          <Badge className="bg-gray-100 text-gray-800">
                            {template.template_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            v{template.version}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {data.defaultTemplateId !== template.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAsDefault(template.id)}
                        >
                          Set as Primary
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTemplate(template.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Default Template Info */}
      {selectedTemplates.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">No Templates Selected</CardTitle>
            <CardDescription>
              If no templates are selected, drivers will use the company's Standard Service Report when starting the job.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="text-xl">{getTemplateTypeIcon(previewTemplate.template_type)}</span>
                  <span>{previewTemplate.name}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground">
                    {previewTemplate.description || 'No description available'}
                  </p>
                </div>
                {getTemplatePreview(previewTemplate)}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      toggleTemplate(previewTemplate.id);
                      setPreviewTemplate(null);
                    }}
                  >
                    {data.selectedTemplateIds.includes(previewTemplate.id) ? 'Remove' : 'Add'} Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};