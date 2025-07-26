import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, FileText, Clock, CheckSquare, Hash, Type, Calendar, Camera, PenTool } from 'lucide-react';

interface TemplateField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
}

interface TemplateSection {
  name: string;
  fields: TemplateField[];
}

interface TemplateData {
  sections: TemplateSection[];
}

interface MaintenanceTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: string;
  template_data?: TemplateData;
  estimated_duration?: number;
  complexity_score?: number;
}

interface TemplatePreviewCardProps {
  template: MaintenanceTemplate;
  showPreview?: boolean;
  onSelect?: (templateId: string) => void;
  isSelected?: boolean;
  showUsageStats?: boolean;
}

export const TemplatePreviewCard: React.FC<TemplatePreviewCardProps> = ({
  template,
  showPreview = true,
  onSelect,
  isSelected,
  showUsageStats = false
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  const getFieldIcon = (fieldType: string) => {
    switch (fieldType.toLowerCase()) {
      case 'text':
      case 'textarea':
        return <Type className="w-3 h-3" />;
      case 'number':
        return <Hash className="w-3 h-3" />;
      case 'checkbox':
        return <CheckSquare className="w-3 h-3" />;
      case 'date':
      case 'time':
        return <Calendar className="w-3 h-3" />;
      case 'photo':
        return <Camera className="w-3 h-3" />;
      case 'signature':
        return <PenTool className="w-3 h-3" />;
      default:
        return <Type className="w-3 h-3" />;
    }
  };

  const getTypeIcon = (type: string) => {
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

  const getComplexityColor = (score?: number) => {
    if (!score) return 'bg-gray-500';
    if (score <= 3) return 'bg-green-500';
    if (score <= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getComplexityLabel = (score?: number) => {
    if (!score) return 'Unknown';
    if (score <= 3) return 'Simple';
    if (score <= 6) return 'Moderate';
    return 'Complex';
  };

  const totalFields = template.template_data?.sections?.reduce(
    (acc, section) => acc + section.fields.length, 0
  ) || 0;

  const estimatedMinutes = template.estimated_duration || Math.max(5, totalFields * 2);

  return (
    <>
      <Card 
        className={`hover:shadow-md transition-all cursor-pointer ${
          isSelected ? 'ring-2 ring-primary border-primary' : ''
        }`}
        onClick={() => onSelect?.(template.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getTypeIcon(template.template_type)}</span>
              <div>
                <CardTitle className="text-base">{template.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {template.description || 'No description available'}
                </p>
              </div>
            </div>
            {showPreview && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewOpen(true);
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              {template.template_type}
            </Badge>
            
            {template.complexity_score && (
              <Badge 
                className={`text-white text-xs ${getComplexityColor(template.complexity_score)}`}
              >
                {getComplexityLabel(template.complexity_score)}
              </Badge>
            )}
            
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              ~{estimatedMinutes}m
            </Badge>
            
            {totalFields > 0 && (
              <Badge variant="outline" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                {totalFields} fields
              </Badge>
            )}
          </div>

          {showUsageStats && (
            <div className="text-xs text-muted-foreground">
              <p>• Used in 23 jobs this month</p>
              <p>• Average completion time: {estimatedMinutes} minutes</p>
              <p>• 98% completion rate</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span className="text-xl">{getTypeIcon(template.template_type)}</span>
              <span>{template.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Template Info */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{template.template_type}</Badge>
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                ~{estimatedMinutes} min
              </Badge>
              {totalFields > 0 && (
                <Badge variant="outline">
                  <FileText className="w-3 h-3 mr-1" />
                  {totalFields} fields
                </Badge>
              )}
            </div>

            {template.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
            )}

            {/* Sections Preview */}
            {template.template_data?.sections && template.template_data.sections.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Form Sections</h4>
                <div className="space-y-4">
                  {template.template_data.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="border rounded-lg p-4">
                      <h5 className="font-medium text-sm mb-3">{section.name}</h5>
                      <div className="grid grid-cols-1 gap-2">
                        {section.fields.map((field, fieldIndex) => (
                          <div 
                            key={fieldIndex}
                            className="flex items-center space-x-2 p-2 bg-muted rounded text-sm"
                          >
                            {getFieldIcon(field.type)}
                            <span className="flex-1">{field.label}</span>
                            <div className="flex items-center space-x-1">
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                              {field.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!template.template_data?.sections || template.template_data.sections.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>No detailed preview available for this template</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};