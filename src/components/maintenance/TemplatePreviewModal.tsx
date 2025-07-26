import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Download, FileText } from "lucide-react";

interface TemplatePreviewModalProps {
  templateId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  templateId,
  isOpen,
  onClose,
}) => {
  const { data: template, isLoading } = useQuery({
    queryKey: ["maintenance-report-template", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      
      const { data, error } = await supabase
        .from("maintenance_report_templates")
        .select("*")
        .eq("id", templateId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!templateId && isOpen,
  });

  const generatePDF = async () => {
    if (!template) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-service-pdf', {
        body: {
          template: template,
          data: {
            customer_name: "Sample Customer",
            location: "123 Sample Street",
            service_type: "Sample Service",
            service_date: new Date().toLocaleDateString(),
            notes: "This is a preview of the template",
          }
        }
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name}_preview.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const templateData = template?.template_data as Record<string, any> || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Template Preview: {template?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <Card className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{template?.name}</h3>
                <p className="text-sm text-gray-600">{template?.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{template?.template_type}</Badge>
                  <Badge variant="outline">{Object.keys(templateData).length} fields</Badge>
                </div>
              </div>
              <Button
                onClick={generatePDF}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </Card>

          {/* Template Preview */}
          <Card className="p-8 bg-white">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center border-b pb-4">
                <h1 className="text-2xl font-bold">Service Report</h1>
                <p className="text-gray-600">Template: {template?.name}</p>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Report Date:</label>
                  <div className="mt-1 p-2 border rounded bg-gray-50">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Report Number:</label>
                  <div className="mt-1 p-2 border rounded bg-gray-50">
                    SVC-{Date.now().toString().slice(-6)}
                  </div>
                </div>
              </div>

              {/* Dynamic Fields */}
              <div className="space-y-4">
                {Object.entries(templateData).map(([fieldId, fieldData]: [string, any]) => (
                  <div key={fieldId} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {fieldData.label || fieldId.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}:
                    </label>
                    <div className="min-h-[40px] p-3 border rounded bg-gray-50">
                      <span className="text-gray-500 italic">
                        {fieldData.description || 'Sample data would appear here'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t pt-4 mt-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="border-t border-gray-400 mt-12 pt-2">
                      <p className="text-sm">Technician Signature</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-gray-400 mt-12 pt-2">
                      <p className="text-sm">Customer Signature</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};