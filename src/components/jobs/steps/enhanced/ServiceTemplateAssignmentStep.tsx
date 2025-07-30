import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Star, Plus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ServiceTemplate {
  id: string;
  template_name: string;
  template_description?: string;
  template_type: string;
  is_default: boolean;
  sections: any[];
  created_by: string;
}

interface ServiceTemplateData {
  defaultTemplateId: string | null;
  assignedTemplateIds: string[];
  templateAssignmentMode: 'automatic' | 'manual';
}

interface ServiceTemplateAssignmentStepProps {
  data: ServiceTemplateData;
  onUpdate: (data: ServiceTemplateData) => void;
  jobType: string;
}

export const ServiceTemplateAssignmentStep: React.FC<ServiceTemplateAssignmentStepProps> = ({ 
  data, 
  onUpdate,
  jobType 
}) => {
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, [jobType]);

  const fetchTemplates = async () => {
    try {
      const { data: templatesData, error } = await supabase
        .from('maintenance_report_templates')
        .select('id, name, description, template_type, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Map database fields to component interface
      const mappedTemplates: ServiceTemplate[] = (templatesData || []).map(template => ({
        id: template.id,
        template_name: template.name,
        template_description: template.description,
        template_type: template.template_type || 'general',
        is_default: false, // We'll determine this based on usage
        sections: [],
        created_by: 'system'
      }));

      setTemplates(mappedTemplates);

      // Auto-select appropriate default template if none selected
      if (!data.defaultTemplateId && mappedTemplates.length > 0) {
        const applicableTemplates = mappedTemplates.filter(t => isTemplateApplicable(t, jobType));
        if (applicableTemplates.length > 0) {
          onUpdate({
            ...data,
            defaultTemplateId: applicableTemplates[0].id,
            assignedTemplateIds: [applicableTemplates[0].id]
          });
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const isTemplateApplicable = (template: ServiceTemplate, currentJobType: string): boolean => {
    // Logic to determine if template is applicable to job type
    switch (currentJobType) {
      case 'delivery':
        return ['delivery_checklist', 'setup_inspection', 'general'].includes(template.template_type);
      case 'pickup':
        return ['pickup_checklist', 'cleanup_inspection', 'general'].includes(template.template_type);
      case 'service':
        return ['cleaning_log', 'maintenance', 'inspection', 'general'].includes(template.template_type);
      case 'on-site-survey':
        return ['inspection', 'site_survey', 'general'].includes(template.template_type);
      default:
        return template.template_type === 'general';
    }
  };

  const handleDefaultTemplateChange = (templateId: string) => {
    const updatedAssignedIds = data.assignedTemplateIds.includes(templateId)
      ? data.assignedTemplateIds
      : [...data.assignedTemplateIds, templateId];

    onUpdate({
      ...data,
      defaultTemplateId: templateId,
      assignedTemplateIds: updatedAssignedIds
    });
  };

  const handleTemplateToggle = (templateId: string, selected: boolean) => {
    let updatedIds: string[];
    
    if (selected) {
      updatedIds = [...data.assignedTemplateIds, templateId];
    } else {
      updatedIds = data.assignedTemplateIds.filter(id => id !== templateId);
      
      // If removing the default template, clear default
      if (templateId === data.defaultTemplateId) {
        onUpdate({
          ...data,
          defaultTemplateId: updatedIds.length > 0 ? updatedIds[0] : null,
          assignedTemplateIds: updatedIds
        });
        return;
      }
    }

    onUpdate({
      ...data,
      assignedTemplateIds: updatedIds
    });
  };

  const getTemplateTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      'delivery_checklist': 'Delivery Checklist',
      'pickup_checklist': 'Pickup Checklist',
      'cleaning_log': 'Cleaning Log',
      'maintenance': 'Maintenance Report',
      'inspection': 'Inspection Report',
      'site_survey': 'Site Survey',
      'general': 'General Report'
    };
    return typeMap[type] || type;
  };

  const getJobTypeRecommendations = () => {
    switch (jobType) {
      case 'delivery':
        return ['delivery_checklist', 'setup_inspection'];
      case 'pickup':
        return ['pickup_checklist', 'cleanup_inspection'];
      case 'service':
        return ['cleaning_log', 'maintenance'];
      case 'on-site-survey':
        return ['inspection', 'site_survey'];
      default:
        return ['general'];
    }
  };

  const applicableTemplates = templates.filter(template => 
    isTemplateApplicable(template, jobType)
  );

  const recommendedTypes = getJobTypeRecommendations();

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
        <h2 className="text-2xl font-semibold text-foreground mb-2">Service Templates</h2>
        <p className="text-muted-foreground">Assign report templates for technicians to complete</p>
      </div>

      {/* Assignment Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Template Assignment Mode</span>
          </CardTitle>
          <CardDescription>
            Choose how templates are assigned to this job
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={data.templateAssignmentMode === 'automatic' ? 'default' : 'outline'}
              onClick={() => onUpdate({ ...data, templateAssignmentMode: 'automatic' })}
              className={`flex-1 h-20 flex-col space-y-2 ${
                data.templateAssignmentMode === 'automatic' ? 'text-white' : ''
              }`}
            >
              <Star className="w-5 h-5" />
              <span>Automatic</span>
              <span className={`text-xs ${
                data.templateAssignmentMode === 'automatic' 
                  ? 'text-white/80' 
                  : 'text-muted-foreground'
              }`}>
                Use recommended templates
              </span>
            </Button>
            <Button
              variant={data.templateAssignmentMode === 'manual' ? 'default' : 'outline'}
              onClick={() => onUpdate({ ...data, templateAssignmentMode: 'manual' })}
              className={`flex-1 h-20 flex-col space-y-2 ${
                data.templateAssignmentMode === 'manual' ? 'text-white' : ''
              }`}
            >
              <Plus className="w-5 h-5" />
              <span>Manual</span>
              <span className={`text-xs ${
                data.templateAssignmentMode === 'manual' 
                  ? 'text-white/80' 
                  : 'text-muted-foreground'
              }`}>
                Choose specific templates
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Default Template Selection */}
      {data.assignedTemplateIds.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Default Template</CardTitle>
            <CardDescription>
              Select which template should be pre-selected for the technician
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={data.defaultTemplateId || ''} 
              onValueChange={handleDefaultTemplateChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose default template">
                  {data.defaultTemplateId && (
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>
                        {templates.find(t => t.id === data.defaultTemplateId)?.template_name}
                      </span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {data.assignedTemplateIds.map(templateId => {
                  const template = templates.find(t => t.id === templateId);
                  if (!template) return null;
                  
                  return (
                    <SelectItem key={templateId} value={templateId}>
                      <div className="flex items-center space-x-2">
                        <span>{template.template_name}</span>
                        <Badge variant="outline">
                          {getTemplateTypeDisplay(template.template_type)}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Available Templates</CardTitle>
          <CardDescription>
            Select templates appropriate for {jobType} jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Recommended Templates */}
            {applicableTemplates.filter(t => recommendedTypes.includes(t.template_type)).length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-primary">
                    Recommended for {jobType} jobs
                  </span>
                </div>
                <div className="space-y-3">
                  {applicableTemplates
                    .filter(template => recommendedTypes.includes(template.template_type))
                    .map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center space-x-3 p-3 border border-primary/20 bg-primary/5 rounded-lg"
                    >
                      <Checkbox
                        checked={data.assignedTemplateIds.includes(template.id)}
                        onCheckedChange={(checked) => 
                          handleTemplateToggle(template.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{template.template_name}</span>
                          {template.id === data.defaultTemplateId && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Star className="w-3 h-3 mr-1" />
                              Default
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {getTemplateTypeDisplay(template.template_type)}
                          </Badge>
                          {template.is_default && (
                            <Badge className="bg-blue-100 text-blue-800">System Default</Badge>
                          )}
                        </div>
                        {template.template_description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {template.template_description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Templates */}
            {applicableTemplates.filter(t => !recommendedTypes.includes(t.template_type)).length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-3">
                    Other Available Templates
                  </div>
                  <div className="space-y-3">
                    {applicableTemplates
                      .filter(template => !recommendedTypes.includes(template.template_type))
                      .map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center space-x-3 p-3 border border-border rounded-lg"
                      >
                        <Checkbox
                          checked={data.assignedTemplateIds.includes(template.id)}
                          onCheckedChange={(checked) => 
                            handleTemplateToggle(template.id, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{template.template_name}</span>
                            {template.id === data.defaultTemplateId && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Star className="w-3 h-3 mr-1" />
                                Default
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {getTemplateTypeDisplay(template.template_type)}
                            </Badge>
                            {template.is_default && (
                              <Badge className="bg-blue-100 text-blue-800">System Default</Badge>
                            )}
                          </div>
                          {template.template_description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {template.template_description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {data.assignedTemplateIds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Template Assignment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Total Templates:</span> {data.assignedTemplateIds.length}
              </div>
              {data.defaultTemplateId && (
                <div className="text-sm">
                  <span className="font-medium">Default Template:</span>{' '}
                  {templates.find(t => t.id === data.defaultTemplateId)?.template_name}
                </div>
              )}
              <div className="text-sm">
                <span className="font-medium">Assignment Mode:</span>{' '}
                {data.templateAssignmentMode === 'automatic' ? 'Automatic' : 'Manual'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
