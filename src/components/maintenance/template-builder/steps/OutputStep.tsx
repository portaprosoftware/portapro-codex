import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { OutputConfig, EnhancedSection, Permissions } from '../types';
import { FileText, Lock, ChevronDown, ChevronRight, Search } from 'lucide-react';

interface OutputStepProps {
  outputConfig: OutputConfig;
  onOutputConfigChange: (config: OutputConfig) => void;
  sections: EnhancedSection[];
  permissions: Permissions;
}

export const OutputStep: React.FC<OutputStepProps> = ({ 
  outputConfig, 
  onOutputConfigChange, 
  sections,
  permissions 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openSections, setOpenSections] = useState<string[]>(sections.map(s => s.id));
  
  // Extract all fields from sections
  const allFields = sections.flatMap(section => 
    section.fields.map(field => ({
      ...field,
      sectionTitle: section.title,
      sectionId: section.id,
    }))
  );

  // Auto-internal fields
  const autoInternalFields = ['gps_coordinates', 'timestamp', 'internal_timestamp', 'tech_location'];
  
  // Fields that are internal-only (shouldn't appear in customer PDF)
  const internalOnlyFieldIds = [
    ...permissions.internal_only_fields,
    ...autoInternalFields,
  ];

  // Fields available for customer PDF (excluding internal-only)
  const customerAvailableFields = allFields.filter(
    field => !internalOnlyFieldIds.includes(field.id)
  );

  // Toggle field in customer PDF
  const toggleCustomerField = (fieldId: string) => {
    const isCurrentlySelected = outputConfig.customer_pdf_fields.includes(fieldId);
    const newFields = isCurrentlySelected
      ? outputConfig.customer_pdf_fields.filter(id => id !== fieldId)
      : [...outputConfig.customer_pdf_fields, fieldId];
    
    onOutputConfigChange({
      ...outputConfig,
      customer_pdf_fields: newFields,
    });
  };

  // Select all / deselect all handlers
  const handleSelectAllCustomer = () => {
    onOutputConfigChange({
      ...outputConfig,
      customer_pdf_fields: customerAvailableFields.map(f => f.id),
    });
  };

  const handleDeselectAllCustomer = () => {
    onOutputConfigChange({
      ...outputConfig,
      customer_pdf_fields: [],
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

  // Initialize customer fields if empty (default to all non-internal fields)
  React.useEffect(() => {
    if (outputConfig.customer_pdf_fields.length === 0 && customerAvailableFields.length > 0) {
      onOutputConfigChange({
        ...outputConfig,
        customer_pdf_fields: customerAvailableFields.map(f => f.id),
      });
    }
  }, [customerAvailableFields.length]);

  // Group fields by section
  const fieldsBySection = sections.map(section => ({
    section,
    customerFields: section.fields.filter(f => !internalOnlyFieldIds.includes(f.id)),
    internalFields: section.fields.filter(f => internalOnlyFieldIds.includes(f.id)),
  }));

  // Filter fields by search term
  const filteredFieldsBySection = fieldsBySection.map(({ section, customerFields, internalFields }) => ({
    section,
    customerFields: customerFields.filter(field =>
      field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.placeholder?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    internalFields,
  })).filter(({ customerFields }) => customerFields.length > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>PDF Output Configuration</CardTitle>
          <CardDescription>
            Control how your service reports appear as PDFs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PDF Layout */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">PDF Layout Order</Label>
            <RadioGroup
              value={outputConfig.pdf_layout}
              onValueChange={(value: 'summary_first' | 'per_unit_first') =>
                onOutputConfigChange({ ...outputConfig, pdf_layout: value })
              }
            >
              <div 
                className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer"
                onClick={() => onOutputConfigChange({ ...outputConfig, pdf_layout: 'summary_first' })}
              >
                <RadioGroupItem value="summary_first" id="summary-first" />
                <div className="flex-1">
                  <Label htmlFor="summary-first" className="cursor-pointer font-medium">
                    Summary First (Recommended)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Show job summary, totals, and exceptions before per-unit details
                  </p>
                </div>
              </div>
              <div 
                className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer"
                onClick={() => onOutputConfigChange({ ...outputConfig, pdf_layout: 'per_unit_first' })}
              >
                <RadioGroupItem value="per_unit_first" id="per-unit-first" />
                <div className="flex-1">
                  <Label htmlFor="per-unit-first" className="cursor-pointer font-medium">
                    Per-Unit First
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Show individual unit details first, summary at the end
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Photo Grid */}
          <div className="space-y-3">
            <Label htmlFor="photo-columns" className="text-base font-semibold">
              Photo Grid Columns
            </Label>
            <Select
              value={outputConfig.photo_grid_columns.toString()}
              onValueChange={(value) =>
                onOutputConfigChange({ ...outputConfig, photo_grid_columns: parseInt(value) })
              }
            >
              <SelectTrigger id="photo-columns">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 column (Full width)</SelectItem>
                <SelectItem value="2">2 columns (Recommended)</SelectItem>
                <SelectItem value="3">3 columns (Compact)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              How many photos per row in the PDF
            </p>
          </div>

          {/* Brand Header */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card">
            <div className="flex-1">
              <Label htmlFor="brand-header" className="text-base font-semibold">
                Show Brand Header
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Include your company logo and info at the top of PDFs
              </p>
            </div>
            <Switch
              id="brand-header"
              checked={outputConfig.show_brand_header}
              onCheckedChange={(checked) =>
                onOutputConfigChange({ ...outputConfig, show_brand_header: checked })
              }
            />
          </div>

          {/* Customer PDF Fields Selection */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h4 className="text-base font-semibold">Customer PDF Fields</h4>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllCustomer}
                  disabled={customerAvailableFields.length === 0}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAllCustomer}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select which fields appear on customer-facing PDFs
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

            {customerAvailableFields.length === 0 ? (
              <div className="p-4 bg-muted/50 rounded text-center text-sm text-muted-foreground">
                No customer-visible fields. All fields are marked as internal-only.
              </div>
            ) : filteredFieldsBySection.length === 0 ? (
              <div className="p-4 bg-muted/50 rounded text-center text-sm text-muted-foreground">
                No fields match your search.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFieldsBySection.map(({ section, customerFields }) => {
                  const isOpen = openSections.includes(section.id);
                  const selectedCount = customerFields.filter(f => 
                    outputConfig.customer_pdf_fields.includes(f.id)
                  ).length;
                  
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
                              {customerFields.length} fields
                            </Badge>
                          </div>
                          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-xs">
                            {selectedCount} Selected
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 ml-6 space-y-2">
                        {customerFields.map(field => (
                          <div
                            key={field.id}
                            className="flex items-start gap-3 p-2 rounded hover:bg-accent/30 transition-colors"
                          >
                            <Checkbox
                              id={`customer-${field.id}`}
                              checked={outputConfig.customer_pdf_fields.includes(field.id)}
                              onCheckedChange={() => toggleCustomerField(field.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={`customer-${field.id}`}
                                className="text-sm cursor-pointer block"
                              >
                                {field.label}
                              </Label>
                              {field.placeholder && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {field.placeholder}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            )}

            <div className="mt-3 p-3 bg-muted/50 rounded">
              <p className="text-sm">
                <strong>{outputConfig.customer_pdf_fields.length}</strong> of{' '}
                <strong>{customerAvailableFields.length}</strong> fields selected for customer PDF
              </p>
            </div>
          </div>

          {/* Internal PDF Info */}
          <div className="p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-primary" />
              <h4 className="text-base font-semibold">Internal PDF (Full Detail)</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              The internal PDF automatically includes all fields:
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {allFields.length} Total Fields
                </Badge>
                <span className="text-sm text-muted-foreground">All form fields</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {internalOnlyFieldIds.length} Internal-Only
                </Badge>
                <span className="text-sm text-muted-foreground">GPS, timestamps, tech notes</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
