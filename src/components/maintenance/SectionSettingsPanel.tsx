import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Eye, 
  EyeOff, 
  Type, 
  Layout, 
  Palette,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SectionSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sectionType: string;
  settings: any;
  onSettingsChange: (newSettings: any) => void;
}

interface FieldMapping {
  id: string;
  label: string;
  dataField: string;
  required: boolean;
  visible: boolean;
  width: string;
}

export const SectionSettingsPanel: React.FC<SectionSettingsPanelProps> = ({
  isOpen,
  onClose,
  sectionType,
  settings,
  onSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const updateFieldMapping = (fieldId: string, updates: Partial<FieldMapping>) => {
    const fieldMappings = localSettings.fieldMappings || [];
    const updatedMappings = fieldMappings.map((field: FieldMapping) =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    updateSetting('fieldMappings', updatedMappings);
  };

  const addCustomField = () => {
    const fieldMappings = localSettings.fieldMappings || [];
    const newField: FieldMapping = {
      id: `custom_${Date.now()}`,
      label: 'Custom Field',
      dataField: '',
      required: false,
      visible: true,
      width: 'auto'
    };
    updateSetting('fieldMappings', [...fieldMappings, newField]);
  };

  const removeField = (fieldId: string) => {
    const fieldMappings = localSettings.fieldMappings || [];
    updateSetting('fieldMappings', fieldMappings.filter((f: FieldMapping) => f.id !== fieldId));
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Visibility & Display</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show Section</Label>
            <p className="text-sm text-muted-foreground">Control if this section appears in reports</p>
          </div>
          <Switch
            checked={localSettings.visible !== false}
            onCheckedChange={(checked) => updateSetting('visible', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Required Section</Label>
            <p className="text-sm text-muted-foreground">Section must be filled out</p>
          </div>
          <Switch
            checked={localSettings.required || false}
            onCheckedChange={(checked) => updateSetting('required', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Allow Page Break</Label>
            <p className="text-sm text-muted-foreground">Allow section to split across pages</p>
          </div>
          <Switch
            checked={localSettings.allowPageBreak !== false}
            onCheckedChange={(checked) => updateSetting('allowPageBreak', checked)}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Layout & Spacing</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="padding-top">Top Padding</Label>
            <Select
              value={localSettings.paddingTop || 'normal'}
              onValueChange={(value) => updateSetting('paddingTop', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="padding-bottom">Bottom Padding</Label>
            <Select
              value={localSettings.paddingBottom || 'normal'}
              onValueChange={(value) => updateSetting('paddingBottom', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="width">Section Width</Label>
          <Select
            value={localSettings.width || 'full'}
            onValueChange={(value) => updateSetting('width', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full Width</SelectItem>
              <SelectItem value="half">Half Width</SelectItem>
              <SelectItem value="third">One Third</SelectItem>
              <SelectItem value="two-thirds">Two Thirds</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStyleSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Typography</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Font Size</Label>
            <Select
              value={localSettings.fontSize || 'normal'}
              onValueChange={(value) => updateSetting('fontSize', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="large">Large</SelectItem>
                <SelectItem value="extra-large">Extra Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Font Weight</Label>
            <Select
              value={localSettings.fontWeight || 'normal'}
              onValueChange={(value) => updateSetting('fontWeight', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Text Color</Label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={localSettings.textColor || '#000000'}
              onChange={(e) => updateSetting('textColor', e.target.value)}
              className="h-10 w-20 rounded border border-border"
            />
            <Input
              value={localSettings.textColor || '#000000'}
              onChange={(e) => updateSetting('textColor', e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Background & Borders</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show Border</Label>
            <p className="text-sm text-muted-foreground">Add border around section</p>
          </div>
          <Switch
            checked={localSettings.showBorder || false}
            onCheckedChange={(checked) => updateSetting('showBorder', checked)}
          />
        </div>

        {localSettings.showBorder && (
          <div className="space-y-2">
            <Label>Border Color</Label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={localSettings.borderColor || '#e5e7eb'}
                onChange={(e) => updateSetting('borderColor', e.target.value)}
                className="h-10 w-20 rounded border border-border"
              />
              <Input
                value={localSettings.borderColor || '#e5e7eb'}
                onChange={(e) => updateSetting('borderColor', e.target.value)}
                placeholder="#e5e7eb"
                className="flex-1"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Background Color</Label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={localSettings.backgroundColor || '#ffffff'}
              onChange={(e) => updateSetting('backgroundColor', e.target.value)}
              className="h-10 w-20 rounded border border-border"
            />
            <Input
              value={localSettings.backgroundColor || '#ffffff'}
              onChange={(e) => updateSetting('backgroundColor', e.target.value)}
              placeholder="#ffffff"
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderFieldSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Field Configuration</h3>
        <Button onClick={addCustomField} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      <div className="space-y-4">
        {(localSettings.fieldMappings || []).map((field: FieldMapping, index: number) => (
          <Card key={field.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{field.label}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={field.visible}
                    onCheckedChange={(checked) => updateFieldMapping(field.id, { visible: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(field.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Display Label</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => updateFieldMapping(field.id, { label: e.target.value })}
                    placeholder="Field label"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Field</Label>
                  <Input
                    value={field.dataField}
                    onChange={(e) => updateFieldMapping(field.id, { dataField: e.target.value })}
                    placeholder="data.field.name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Width</Label>
                  <Select
                    value={field.width}
                    onValueChange={(value) => updateFieldMapping(field.id, { width: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="25%">25%</SelectItem>
                      <SelectItem value="33%">33%</SelectItem>
                      <SelectItem value="50%">50%</SelectItem>
                      <SelectItem value="67%">67%</SelectItem>
                      <SelectItem value="75%">75%</SelectItem>
                      <SelectItem value="100%">100%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-4 pt-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={field.required}
                      onCheckedChange={(checked) => updateFieldMapping(field.id, { required: checked })}
                    />
                    <Label className="text-sm">Required</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!localSettings.fieldMappings || localSettings.fieldMappings.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Type className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No custom fields configured</p>
            <p className="text-sm">Add fields to customize this section's data display</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderConditionalSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Conditional Visibility</h3>
        <p className="text-sm text-muted-foreground">
          Show or hide this section based on data conditions
        </p>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Conditional Display</Label>
            <p className="text-sm text-muted-foreground">Use rules to control when section appears</p>
          </div>
          <Switch
            checked={localSettings.conditionalDisplay || false}
            onCheckedChange={(checked) => updateSetting('conditionalDisplay', checked)}
          />
        </div>

        {localSettings.conditionalDisplay && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Display Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Show when field</Label>
                <Input
                  value={localSettings.conditionalField || ''}
                  onChange={(e) => updateSetting('conditionalField', e.target.value)}
                  placeholder="e.g., job.type"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select
                    value={localSettings.conditionalOperator || 'equals'}
                    onValueChange={(value) => updateSetting('conditionalOperator', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="not_equals">Not Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="not_contains">Not Contains</SelectItem>
                      <SelectItem value="empty">Is Empty</SelectItem>
                      <SelectItem value="not_empty">Not Empty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    value={localSettings.conditionalValue || ''}
                    onChange={(e) => updateSetting('conditionalValue', e.target.value)}
                    placeholder="comparison value"
                  />
                </div>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Example:</strong> Show this section when "job.type" equals "maintenance"
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Section Settings - {sectionType}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center space-x-1">
              <Layout className="h-4 w-4" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center space-x-1">
              <Palette className="h-4 w-4" />
              <span>Style</span>
            </TabsTrigger>
            <TabsTrigger value="fields" className="flex items-center space-x-1">
              <Type className="h-4 w-4" />
              <span>Fields</span>
            </TabsTrigger>
            <TabsTrigger value="conditional" className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>Rules</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="general" className="space-y-6 mt-0">
              {renderGeneralSettings()}
            </TabsContent>

            <TabsContent value="style" className="space-y-6 mt-0">
              {renderStyleSettings()}
            </TabsContent>

            <TabsContent value="fields" className="space-y-6 mt-0">
              {renderFieldSettings()}
            </TabsContent>

            <TabsContent value="conditional" className="space-y-6 mt-0">
              {renderConditionalSettings()}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};