import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OutputConfig } from '../types';

interface OutputStepProps {
  outputConfig: OutputConfig;
  onOutputConfigChange: (config: OutputConfig) => void;
}

export const OutputStep: React.FC<OutputStepProps> = ({ outputConfig, onOutputConfigChange }) => {
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

          {/* Dual PDF Generation */}
          <div className="p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10">
            <h4 className="text-base font-semibold mb-2">Customer vs Internal PDFs</h4>
            <p className="text-sm text-muted-foreground mb-3">
              This template will automatically generate two versions:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium min-w-[120px]">Customer PDF:</span>
                <span className="text-sm text-muted-foreground">
                  Clean, professional version without internal fields (GPS, timestamps)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium min-w-[120px]">Internal PDF:</span>
                <span className="text-sm text-muted-foreground">
                  Full detail with all fields, GPS data, and internal notes
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
