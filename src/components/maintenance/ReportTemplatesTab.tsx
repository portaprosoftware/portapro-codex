
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TemplateEditModal } from "./TemplateEditModal";
import { Plus, FileText, Edit, Trash2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  created_at: string;
  template_fields: any;
  is_active: boolean;
}

export const ReportTemplatesTab: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["maintenance-report-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_report_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Report Templates</h2>
          <p className="text-gray-600">Create and manage maintenance report templates</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.map((template) => (
          <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow rounded-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTemplate(template.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Last edited {new Date(template.created_at).toLocaleDateString()}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {Object.keys(template.template_fields || {}).length} fields
              </span>
              <Button variant="outline" size="sm">
                Preview
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {templates?.length === 0 && (
        <Card className="p-12 text-center rounded-2xl">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-600 mb-4">Create your first report template to get started</p>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </Card>
      )}

      {/* Template Edit Modal */}
      <TemplateEditModal
        templateId={selectedTemplate}
        isOpen={!!selectedTemplate || isCreating}
        isCreating={isCreating}
        onClose={() => {
          setSelectedTemplate(null);
          setIsCreating(false);
        }}
      />
    </div>
  );
};
