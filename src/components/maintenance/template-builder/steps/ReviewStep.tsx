import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { EnhancedTemplate } from '../types';

interface ReviewStepProps {
  template: Partial<EnhancedTemplate>;
  version: string;
  onVersionChange: (version: string) => void;
  isDefaultForType: boolean;
  onIsDefaultChange: (isDefault: boolean) => void;
  onPublish: () => void;
  isPublishing: boolean;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  template,
  version,
  onVersionChange,
  isDefaultForType,
  onIsDefaultChange,
  onPublish,
  isPublishing,
}) => {
  const isValid = template.name && template.template_type && (template.sections?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      <Card className={isValid ? 'border-gray-200 bg-gray-100' : 'border-yellow-500/50 bg-yellow-50/50'}>
        <CardHeader>
          <div className="flex items-center gap-2">
            {isValid ? (
              <CheckCircle className="w-5 h-5 text-gray-700" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
            <CardTitle className={isValid ? 'text-gray-900' : 'text-yellow-900'}>
              {isValid ? 'Template Ready to Publish' : 'Template Incomplete'}
            </CardTitle>
          </div>
        </CardHeader>
        {!isValid && (
          <CardContent>
            <p className="text-sm text-yellow-800">
              Please complete all required steps before publishing
            </p>
          </CardContent>
        )}
      </Card>

      {/* Template Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Template Summary</CardTitle>
          <CardDescription>Review your template configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Template Name</Label>
              <p className="font-medium">{template.name || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Template Type</Label>
              <div className="mt-1">
                {template.template_type ? (
                  <Badge className="capitalize">{template.template_type}</Badge>
                ) : (
                  <p className="text-muted-foreground">Not set</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Description</Label>
            <p className="text-sm">{template.description || 'No description'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Sections</Label>
              <p className="font-medium">{template.sections?.length || 0} sections</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Per-Unit Loop</Label>
              <p className="font-medium">
                {template.logic_rules?.per_unit_loop ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">PDF Layout</Label>
              <p className="font-medium capitalize">
                {template.output_config?.pdf_layout?.replace('_', ' ') || 'Not configured'}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Photo Columns</Label>
              <p className="font-medium">{template.output_config?.photo_grid_columns || 2}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publishing Options */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing Options</CardTitle>
          <CardDescription>Set version and default status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              value={version}
              onChange={(e) => onVersionChange(e.target.value)}
              placeholder="e.g., 1.0"
            />
            <p className="text-sm text-muted-foreground">
              Track changes with version numbers
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div>
              <Label className="text-base font-semibold">
                Set as Default for {template.template_type ? template.template_type : 'this'} jobs
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Use this template automatically for new jobs of this type
              </p>
            </div>
            <Button
              variant={isDefaultForType ? 'default' : 'outline'}
              onClick={() => onIsDefaultChange(!isDefaultForType)}
            >
              {isDefaultForType ? 'Default' : 'Not Default'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Publish Button */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-6">
          <Button
            onClick={onPublish}
            disabled={!isValid || isPublishing}
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-primary/80"
          >
            {isPublishing ? 'Publishing...' : 'Publish Template'}
          </Button>
          <p className="text-sm text-muted-foreground text-center mt-3">
            Your template will be saved and ready to use on jobs
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
