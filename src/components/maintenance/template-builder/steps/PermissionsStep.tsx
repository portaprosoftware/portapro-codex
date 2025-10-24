import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Permissions, EnhancedSection } from '../types';
import { Lock, ChevronDown, ChevronRight, Search, Shield, Image, FileX } from 'lucide-react';
import { RolePermissionCard } from './permissions/RolePermissionCard';
import { FieldSelectorDialog } from './permissions/FieldSelectorDialog';

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
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  
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
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>
            Control who can edit fields, manage fees, and access reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Permission Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RolePermissionCard
              role="tech"
              permissions={[
                {
                  label: 'Can fill out all report fields',
                  value: true,
                  disabled: true,
                },
                {
                  label: 'Can see suggested fees',
                  value: permissions.fee_permissions.tech_can_see_suggestions,
                  onChange: (checked) => onPermissionsChange({
                    ...permissions,
                    fee_permissions: { ...permissions.fee_permissions, tech_can_see_suggestions: checked },
                  }),
                },
                {
                  label: 'Can add/remove suggested fees',
                  value: permissions.fee_permissions.tech_can_add_remove_fees,
                  onChange: (checked) => onPermissionsChange({
                    ...permissions,
                    fee_permissions: { ...permissions.fee_permissions, tech_can_add_remove_fees: checked },
                  }),
                },
                {
                  label: 'Can edit fee amounts',
                  value: permissions.fee_permissions.tech_can_edit_amounts,
                  disabled: true,
                },
                {
                  label: 'Require note when removing fee',
                  value: permissions.fee_permissions.require_note_on_fee_removal,
                  onChange: (checked) => onPermissionsChange({
                    ...permissions,
                    fee_permissions: { ...permissions.fee_permissions, require_note_on_fee_removal: checked },
                  }),
                },
              ]}
            />

            <RolePermissionCard
              role="office"
              permissions={[
                {
                  label: 'Can edit all fields',
                  value: true,
                  disabled: true,
                },
                {
                  label: 'Can edit submitted reports',
                  value: permissions.stage_permissions.office_can_edit_submitted,
                  onChange: (checked) => onPermissionsChange({
                    ...permissions,
                    stage_permissions: { ...permissions.stage_permissions, office_can_edit_submitted: checked },
                  }),
                },
                {
                  label: 'Can adjust fee amounts',
                  value: permissions.fee_permissions.office_can_edit_amounts,
                  onChange: (checked) => onPermissionsChange({
                    ...permissions,
                    fee_permissions: { ...permissions.fee_permissions, office_can_edit_amounts: checked },
                  }),
                },
                {
                  label: 'Can hide photos from customer PDF',
                  value: permissions.photo_permissions.office_can_hide_photos,
                  onChange: (checked) => onPermissionsChange({
                    ...permissions,
                    photo_permissions: { ...permissions.photo_permissions, office_can_hide_photos: checked },
                  }),
                },
                {
                  label: 'Can void reports',
                  value: permissions.delete_void_permissions.office_can_void,
                  onChange: (checked) => onPermissionsChange({
                    ...permissions,
                    delete_void_permissions: { ...permissions.delete_void_permissions, office_can_void: checked },
                  }),
                },
              ]}
            />
          </div>

          {/* Admin Card - Read Only */}
          <Card className="p-6 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold">
                Manager
              </Badge>
              <h3 className="font-semibold text-lg">Admin / Manager</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-600" />
                <span>Full access to all fields</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-600" />
                <span>Can reopen locked reports</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-600" />
                <span>Can delete reports</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-600" />
                <span>Full fee management</span>
              </div>
            </div>
          </Card>

          <Separator />

          {/* Report Stage Workflow */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">Report Stage Workflow</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lock-after-submit"
                  checked={permissions.stage_permissions.lock_after_submit}
                  onCheckedChange={(checked) => onPermissionsChange({
                    ...permissions,
                    stage_permissions: { ...permissions.stage_permissions, lock_after_submit: checked as boolean },
                  })}
                />
                <Label htmlFor="lock-after-submit" className="text-sm cursor-pointer">
                  Lock report after technician submits
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lock-after-customer"
                  checked={permissions.stage_permissions.lock_after_customer_send}
                  onCheckedChange={(checked) => onPermissionsChange({
                    ...permissions,
                    stage_permissions: { ...permissions.stage_permissions, lock_after_customer_send: checked as boolean },
                  })}
                />
                <Label htmlFor="lock-after-customer" className="text-sm cursor-pointer">
                  Lock report after sending to customer
                </Label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Locked reports can only be edited by admins unless reopened
              </p>
            </div>
          </Card>

          <Separator />

          {/* Photo Redaction */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">Photo Redaction</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow-internal-photos"
                  checked={permissions.photo_permissions.allow_internal_only_photos}
                  onCheckedChange={(checked) => onPermissionsChange({
                    ...permissions,
                    photo_permissions: { ...permissions.photo_permissions, allow_internal_only_photos: checked as boolean },
                  })}
                />
                <Label htmlFor="allow-internal-photos" className="text-sm cursor-pointer">
                  Allow marking photos as internal-only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="log-redactions"
                  checked={permissions.photo_permissions.log_photo_redactions}
                  onCheckedChange={(checked) => onPermissionsChange({
                    ...permissions,
                    photo_permissions: { ...permissions.photo_permissions, log_photo_redactions: checked as boolean },
                  })}
                />
                <Label htmlFor="log-redactions" className="text-sm cursor-pointer">
                  Log photo redactions for audit trail
                </Label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Hidden photos remain internally for legal protection
              </p>
            </div>
          </Card>

          <Separator />

          {/* Delete/Void Permissions */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileX className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">Delete & Void Rules</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="require-deletion-reason"
                  checked={permissions.delete_void_permissions.require_deletion_reason}
                  onCheckedChange={(checked) => onPermissionsChange({
                    ...permissions,
                    delete_void_permissions: { ...permissions.delete_void_permissions, require_deletion_reason: checked as boolean },
                  })}
                />
                <Label htmlFor="require-deletion-reason" className="text-sm cursor-pointer">
                  Require reason when deleting reports
                </Label>
              </div>
              <div className="p-3 bg-muted/50 rounded text-sm">
                <p className="font-medium">Who can delete/void:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>Admins can delete reports (permanently)</li>
                  <li>Office staff can void reports (kept for records)</li>
                  <li>Technicians cannot delete or void</li>
                </ul>
              </div>
            </div>
          </Card>

          <Separator />

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

      <FieldSelectorDialog
        open={showFieldSelector}
        onOpenChange={setShowFieldSelector}
        sections={sections}
        selectedFields={permissions.tech_editable_fields}
        onFieldsChange={(fields) => onPermissionsChange({
          ...permissions,
          tech_editable_fields: fields,
        })}
        title="Select Technician Editable Fields"
      />
    </div>
  );
};
