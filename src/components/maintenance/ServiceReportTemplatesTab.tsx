import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Copy, Trash2, FileText, Loader2, Eye } from 'lucide-react';
import { BottomSheetWizard } from './template-builder/BottomSheetWizard';
import { PreviewModal } from './template-builder/PreviewModal';
import { useTemplates } from '@/hooks/useTemplates';
import { EnhancedTemplate } from './template-builder/types';
import { toast } from 'sonner';

export const ServiceReportTemplatesTab = () => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EnhancedTemplate | undefined>();
  const [previewTemplate, setPreviewTemplate] = useState<Partial<EnhancedTemplate> | null>(null);
  
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, cloneTemplate } = useTemplates();

  const handleSaveTemplate = async (template: Partial<EnhancedTemplate>) => {
    if (editingTemplate) {
      await updateTemplate.mutateAsync({ ...template, id: editingTemplate.id } as any);
    } else {
      await createTemplate.mutateAsync(template as any);
    }
    setIsWizardOpen(false);
    setEditingTemplate(undefined);
  };

  const handleEditTemplate = (template: EnhancedTemplate) => {
    setEditingTemplate(template);
    setIsWizardOpen(true);
  };

  const handleCloneTemplate = async (id: string) => {
    await cloneTemplate.mutateAsync(id);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate.mutateAsync(id);
    }
  };

  const handleOpenPreview = (template?: Partial<EnhancedTemplate>) => {
    if (template) {
      setPreviewTemplate(template);
    } else {
      setPreviewTemplate({
        name: '',
        description: '',
        template_type: 'service',
        sections: [],
        logic_rules: { per_unit_loop: false, auto_requirements: [], default_values: {}, fee_suggestions: [] },
        permissions: { tech_editable_fields: ['*'], office_editable_fields: ['*'], internal_only_fields: [] },
        output_config: { pdf_layout: 'summary_first', customer_pdf_fields: [], internal_pdf_fields: [], photo_grid_columns: 2, watermark: '', show_brand_header: true },
        version: '1.0',
        is_default_for_type: false,
      });
    }
    setIsPreviewOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Service Report Templates</CardTitle>
              <CardDescription>
                Create and manage customizable templates for field service reports
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => handleOpenPreview()}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Live Preview
              </Button>
              <Button 
                onClick={() => {
                  setEditingTemplate(undefined);
                  setIsWizardOpen(true);
                }} 
                className="gap-2"
                disabled={isWizardOpen}
              >
                <Plus className="w-4 h-4" />
                New Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : templates && templates.length > 0 ? (
            <div className="grid gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{template.name}</h4>
                        {template.is_default_for_type && (
                          <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white text-xs">
                            Default
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          v{template.version}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {template.template_type} • {template.sections?.length || 0} sections
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleOpenPreview(template)}
                      title="Preview template"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditTemplate(template)}
                      title="Edit template"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleCloneTemplate(template.id)}
                      title="Clone template"
                      disabled={cloneTemplate.isPending}
                    >
                      {cloneTemplate.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteTemplate(template.id)}
                      title="Delete template"
                      disabled={deleteTemplate.isPending}
                    >
                      {deleteTemplate.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No templates yet</p>
              <p className="text-xs mt-1">Create your first template to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      <BottomSheetWizard
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setEditingTemplate(undefined);
        }}
        onSave={handleSaveTemplate}
        initialTemplate={editingTemplate}
      />

      {previewTemplate && (
        <PreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          template={previewTemplate}
        />
      )}
    </>
  );
};
