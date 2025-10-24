import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Permissions, EnhancedSection } from '../types';
import { Lock, ChevronDown, ChevronRight, Search } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [openSections, setOpenSections] = useState<string[]>(sections.map(s => s.id));
  
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

  // Select all / deselect all handlers
  const handleSelectAll = () => {
    const allFieldIds = allFields
      .filter(f => !autoInternalFields.includes(f.id))
      .map(f => f.id);
    onPermissionsChange({
      ...permissions,
      internal_only_fields: allFieldIds,
    });
  };

  const handleDeselectAll = () => {
    onPermissionsChange({
      ...permissions,
      internal_only_fields: [],
    });
  };

  // Toggle section collapse
  const toggleSection = (sectionId: string) => {
    setOpenSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Filter fields by search term
  const filteredFieldsBySection = sections.map(section => ({
    section,
    fields: section.fields.filter(field =>
      field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.placeholder?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(({ fields }) => fields.length > 0);

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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-base font-semibold">Internal-Only Fields</h4>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={allFields.filter(f => !autoInternalFields.includes(f.id)).length === 0}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select fields that should only appear on internal PDFs (hidden from customers)
            </p>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {fieldsBySection.length === 0 ? (
              <div className="p-4 bg-muted/50 rounded text-center text-sm text-muted-foreground">
                No fields yet. Add sections in Step 2 to configure permissions.
              </div>
            ) : filteredFieldsBySection.length === 0 ? (
              <div className="p-4 bg-muted/50 rounded text-center text-sm text-muted-foreground">
                No fields match your search.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFieldsBySection.map(({ section, fields }) => {
                  const isOpen = openSections.includes(section.id);
                  const sectionInternalCount = fields.filter(f => isFieldInternal(f.id)).length;
                  
                  return (
                    <Collapsible
                      key={section.id}
                      open={isOpen}
                      onOpenChange={() => toggleSection(section.id)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-2">
                            {isOpen ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            <h5 className="text-sm font-medium">{section.title}</h5>
                            <Badge variant="outline" className="text-xs">
                              {fields.length} fields
                            </Badge>
                          </div>
                          {sectionInternalCount > 0 && (
                            <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-xs">
                              {sectionInternalCount} Internal
                            </Badge>
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 ml-6 space-y-2">
                        {fields.map(field => {
                          const isAutoInternal = autoInternalFields.includes(field.id);
                          const isInternal = isFieldInternal(field.id);
                          
                          return (
                            <div
                              key={field.id}
                              className="flex items-start gap-3 p-2 rounded hover:bg-accent/30 transition-colors"
                            >
                              <Checkbox
                                id={`internal-${field.id}`}
                                checked={isInternal}
                                onCheckedChange={() => !isAutoInternal && toggleInternalOnly(field.id)}
                                disabled={isAutoInternal}
                                className="mt-0.5"
                              />
                              <div className="flex-1">
                                <Label
                                  htmlFor={`internal-${field.id}`}
                                  className={`text-sm cursor-pointer block ${isAutoInternal ? 'text-muted-foreground' : ''}`}
                                >
                                  {field.label}
                                  {isAutoInternal && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      (Auto-internal)
                                    </span>
                                  )}
                                </Label>
                                {field.placeholder && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {field.placeholder}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
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
