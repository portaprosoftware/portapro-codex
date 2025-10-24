import React from 'react';
import { Badge } from '@/components/ui/badge';
import { EnhancedTemplate } from '../types';

interface PhonePreviewProps {
  template: Partial<EnhancedTemplate>;
}

export const PhonePreview: React.FC<PhonePreviewProps> = ({ template }) => {
  return (
    <div className="flex justify-center">
      {/* Phone Frame */}
      <div className="w-[375px] h-[667px] bg-background border-8 border-foreground/20 rounded-[2.5rem] shadow-2xl overflow-hidden">
        {/* Phone Notch */}
        <div className="h-6 bg-foreground/20 rounded-b-2xl mx-auto w-40" />
        
        {/* Screen Content */}
        <div className="h-full bg-white overflow-y-auto pb-20">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary to-primary/80 text-white p-4 shadow-md z-10">
            <h2 className="font-bold text-lg">{template.name || 'Service Report'}</h2>
            <p className="text-xs opacity-90 capitalize">{template.template_type || 'Template'}</p>
          </div>

          {/* Form Sections */}
          <div className="p-4 space-y-4">
            {template.sections && template.sections.length > 0 ? (
              template.sections.map((section) => (
                <div key={section.id} className="bg-card border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-sm">{section.title}</h3>
                    {section.repeat_for_each && (
                      <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white text-xs">
                        Loop
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{section.description}</p>
                  
                  {/* Fields Preview */}
                  <div className="space-y-2">
                    {section.fields.slice(0, 3).map((field) => (
                      <div key={field.id} className="bg-muted/30 rounded p-2">
                        <p className="text-xs font-medium text-foreground/80">
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </p>
                        <div className="h-8 bg-background rounded mt-1 border" />
                      </div>
                    ))}
                    {section.fields.length > 3 && (
                      <p className="text-xs text-muted-foreground italic text-center">
                        +{section.fields.length - 3} more fields
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No sections added yet</p>
                <p className="text-xs mt-1">Add blocks to see preview</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {template.sections && template.sections.length > 0 && (
            <div className="p-4 space-y-2">
              <button className="w-full border rounded-lg font-medium py-2.5 text-sm bg-background">
                Save Draft
              </button>
              <button className="w-full bg-gradient-to-r from-primary to-primary/80 text-white font-semibold py-2.5 rounded-lg text-sm">
                Submit Report
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
