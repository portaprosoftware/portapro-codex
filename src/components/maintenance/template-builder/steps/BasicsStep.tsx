import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TemplateType } from '../types';

interface BasicsStepProps {
  name: string;
  description: string;
  templateType: TemplateType;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTemplateTypeChange: (value: TemplateType) => void;
}

const templateTypeOptions: { value: TemplateType; label: string; description: string }[] = [
  { value: 'service', label: 'Service', description: 'Regular route service visits' },
  { value: 'delivery', label: 'Delivery', description: 'Initial unit delivery and setup' },
  { value: 'pickup', label: 'Pickup', description: 'Unit removal and cleanup' },
  { value: 'event', label: 'Event Service', description: 'Event-based service and reconciliation' },
  { value: 'repair', label: 'Repair', description: 'Unit repair and maintenance' },
  { value: 'inspection', label: 'Inspection', description: 'Site surveys and walkthroughs' },
];

export const BasicsStep: React.FC<BasicsStepProps> = ({
  name,
  description,
  templateType,
  onNameChange,
  onDescriptionChange,
  onTemplateTypeChange,
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Template Basics</CardTitle>
          <CardDescription>
            Name your template and choose what type of job it's for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              placeholder="e.g., Weekly Route Service (Per-Unit Loop)"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="text-base"
            />
            <p className="text-sm text-muted-foreground">
              Give it a clear name techs will recognize
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              placeholder="e.g., Standard service template with per-unit scanning and tracking"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              className="text-base resize-none"
            />
            <p className="text-sm text-muted-foreground">
              When should this template be used?
            </p>
          </div>

          {/* Template Type */}
          <div className="space-y-2">
            <Label htmlFor="template-type">Template Type *</Label>
            <Select value={templateType} onValueChange={onTemplateTypeChange}>
              <SelectTrigger id="template-type" className="text-base">
                <SelectValue placeholder="Select a template type" />
              </SelectTrigger>
              <SelectContent>
                {templateTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-base">
                    <div className="flex flex-col items-start py-1">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              This determines which starter sections are available
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
