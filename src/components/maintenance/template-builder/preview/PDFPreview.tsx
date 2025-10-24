import React from 'react';
import { Badge } from '@/components/ui/badge';
import { EnhancedTemplate } from '../types';
import { FileText, Image } from 'lucide-react';

interface PDFPreviewProps {
  template: Partial<EnhancedTemplate>;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ template }) => {
  const showSummaryFirst = template.output_config?.pdf_layout === 'summary_first';

  return (
    <div className="bg-muted/30 p-6 rounded-lg">
      {/* PDF Page Container */}
      <div className="bg-white shadow-xl max-w-3xl mx-auto">
        {/* PDF Header */}
        {template.output_config?.show_brand_header && (
          <div className="border-b-4 border-primary p-6 bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Company Name & Logo</h1>
                <p className="text-sm text-muted-foreground">Your Company Tagline Here</p>
              </div>
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white capitalize">
                {template.template_type || 'Service'} Report
              </Badge>
            </div>
          </div>
        )}

        {/* PDF Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div className="border-b pb-3">
            <h2 className="text-xl font-bold">{template.name || 'Service Report'}</h2>
            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
          </div>

          {/* Summary Section (if summary first) */}
          {showSummaryFirst && template.sections && template.sections.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Summary
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Sections:</span>
                  <span className="font-semibold ml-2">{template.sections.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Per-Unit Loop:</span>
                  <span className="font-semibold ml-2">
                    {template.logic_rules?.per_unit_loop ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sections */}
          {template.sections && template.sections.length > 0 ? (
            template.sections.map((section, index) => (
              <div key={section.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-muted-foreground">
                    Section {index + 1}
                  </span>
                  <h3 className="font-semibold text-base">{section.title}</h3>
                  {section.repeat_for_each && (
                    <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white text-xs">
                      Repeating
                    </Badge>
                  )}
                </div>

                {/* Fields */}
                <div className="space-y-2">
                  {section.fields.slice(0, 5).map((field) => (
                    <div key={field.id} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground min-w-[140px]">
                        {field.label}:
                      </span>
                      <span className="flex-1 border-b border-dotted border-muted-foreground/30 pb-1">
                        {field.type === 'photo' || field.type === 'photo_set' ? (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Image className="w-3 h-3" />
                            Photo
                          </span>
                        ) : field.type === 'signature' ? (
                          <span className="italic text-muted-foreground">Signature</span>
                        ) : (
                          <span className="text-muted-foreground/50">Sample data</span>
                        )}
                      </span>
                    </div>
                  ))}
                  {section.fields.length > 5 && (
                    <p className="text-xs text-muted-foreground italic text-center pt-2">
                      +{section.fields.length - 5} more fields
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No sections to preview</p>
              <p className="text-xs mt-1">Add sections to see PDF layout</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-4 mt-6">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Page 1 of 1</span>
              <span>Generated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
