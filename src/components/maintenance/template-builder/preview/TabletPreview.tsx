import React from 'react';
import { Badge } from '@/components/ui/badge';
import { EnhancedTemplate } from '../types';

interface TabletPreviewProps {
  template: Partial<EnhancedTemplate>;
}

export const TabletPreview: React.FC<TabletPreviewProps> = ({ template }) => {
  return (
    <div className="flex justify-center">
      {/* Tablet Frame */}
      <div className="w-full max-w-3xl h-[600px] bg-background border-8 border-foreground/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Screen Content */}
        <div className="h-full bg-white overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary to-primary/80 text-white p-6 shadow-md z-10">
            <h2 className="font-bold text-2xl">{template.name || 'Service Report'}</h2>
            <p className="text-sm opacity-90 capitalize mt-1">{template.template_type || 'Template'}</p>
          </div>

          {/* Form Sections - Two Column Layout */}
          <div className="p-6">
            {template.sections && template.sections.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {template.sections.map((section) => (
                  <div key={section.id} className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-base">{section.title}</h3>
                      {section.repeat_for_each && (
                        <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white">
                          Loop
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                    
                    {/* Fields Preview */}
                    <div className="space-y-3">
                      {section.fields.slice(0, 4).map((field) => (
                        <div key={field.id}>
                          <label className="text-sm font-medium text-foreground/90 block mb-1">
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                          </label>
                          <div className="h-10 bg-background rounded border" />
                        </div>
                      ))}
                      {section.fields.length > 4 && (
                        <p className="text-sm text-muted-foreground italic text-center">
                          +{section.fields.length - 4} more fields
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-base">No sections added yet</p>
                <p className="text-sm mt-2">Add blocks to see tablet preview</p>
              </div>
            )}

            {/* Submit Button */}
            {template.sections && template.sections.length > 0 && (
              <div className="mt-6 flex justify-end gap-3">
                <button className="px-6 py-3 border rounded-lg font-medium">
                  Save Draft
                </button>
                <button className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white font-semibold rounded-lg">
                  Submit Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
