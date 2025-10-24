import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Permissions, EnhancedSection } from '../types';
import { Lock } from 'lucide-react';

interface PermissionsStepProps {
  permissions: Permissions;
  onPermissionsChange: (permissions: Permissions) => void;
  sections: EnhancedSection[];
}

export const PermissionsStep: React.FC<PermissionsStepProps> = ({
  permissions,
  onPermissionsChange,
  sections,
}) => {
  // Extract all fields from all sections
  const allFields = sections.flatMap(section => 
    section.fields.map(field => ({
      ...field,
      sectionTitle: section.title,
      sectionId: section.id,
    }))
  );

  // Auto-detect fields that should be internal-only
  const autoInternalFields = ['gps_coordinates', 'timestamp', 'internal_timestamp', 'tech_location'];
  
  const toggleInternalOnly = (fieldId: string) => {
    const isCurrentlyInternal = permissions.internal_only_fields.includes(fieldId);
    const newInternalFields = isCurrentlyInternal
      ? permissions.internal_only_fields.filter(id => id !== fieldId)
      : [...permissions.internal_only_fields, fieldId];
    
    onPermissionsChange({
      ...permissions,
      internal_only_fields: newInternalFields,
    });
  };

  const isFieldInternal = (fieldId: string) => {
    return permissions.internal_only_fields.includes(fieldId) || autoInternalFields.includes(fieldId);
  };

  // Group fields by section
  const fieldsBySection = sections.map(section => ({
    section,
    fields: section.fields,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Field Visibility & Permissions</CardTitle>
          <CardDescription>
            Mark which fields should be hidden from customer PDFs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold">
                  Tech
                </Badge>
                <h4 className="text-sm font-semibold">Technician Access</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Can edit all fields in the field
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold">
                  Office
                </Badge>
                <h4 className="text-sm font-semibold">Office Access</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Can edit all fields + fees/notes
              </p>
            </div>
          </div>

          {/* Internal-Only Field Selection */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-base font-semibold">Internal-Only Fields</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select fields that should only appear on internal PDFs (hidden from customers)
            </p>

            {fieldsBySection.length === 0 ? (
              <div className="p-4 bg-muted/50 rounded text-center text-sm text-muted-foreground">
                No fields yet. Add sections in Step 2 to configure permissions.
              </div>
            ) : (
              <div className="space-y-4">
                {fieldsBySection.map(({ section, fields }) => (
                  <div key={section.id} className="space-y-2">
                    <h5 className="text-sm font-medium text-muted-foreground">
                      {section.title}
                    </h5>
                    <div className="space-y-2 pl-4">
                      {fields.map(field => {
                        const isAutoInternal = autoInternalFields.includes(field.id);
                        const isInternal = isFieldInternal(field.id);
                        
                        return (
                          <div key={field.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`internal-${field.id}`}
                              checked={isInternal}
                              onCheckedChange={() => !isAutoInternal && toggleInternalOnly(field.id)}
                              disabled={isAutoInternal}
                            />
                            <Label
                              htmlFor={`internal-${field.id}`}
                              className={`text-sm flex-1 cursor-pointer ${isAutoInternal ? 'text-muted-foreground' : ''}`}
                            >
                              {field.label}
                              {isAutoInternal && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (Auto-internal)
                                </span>
                              )}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="p-3 rounded bg-muted/50">
            <p className="text-sm">
              <strong>{permissions.internal_only_fields.length + autoInternalFields.length}</strong> fields marked as internal-only
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              These will be excluded from customer PDFs in Step 5
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
