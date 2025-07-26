
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TemplateEditModal } from "./TemplateEditModal";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import { Plus, FileText, Edit, Trash2, Search, Grid, List } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  created_at: string;
  template_data: any;
  is_active: boolean;
}

export const ReportTemplatesTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "icons">("grid");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["maintenance-report-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_report_templates")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true }); // Alphabetical order
      
      if (error) throw error;
      return data || [];
    },
  });

  // Filter templates based on search term
  const filteredTemplates = templates?.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("maintenance_report_templates")
        .update({ is_active: false })
        .eq("id", templateId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-report-templates"] });
      toast.success("Template deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete template");
      console.error(error);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Report Templates</h2>
          <p className="text-gray-600">Create and manage service report templates</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="px-3"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "icons" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("icons")}
              className="px-3"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white w-full md:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search templates by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Templates Display */}
      {viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="p-6 hover:shadow-lg transition-all duration-200 hover:scale-105 rounded-2xl group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTemplate(template.id)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-600"
                    onClick={() => deleteMutation.mutate(template.id)}
                    disabled={deleteMutation.isPending}
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
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {Object.keys(template.template_data || {}).length} fields
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setPreviewTemplate(template.id)}
                >
                  Preview
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Icon View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="p-4 hover:shadow-lg transition-all duration-200 hover:scale-105 rounded-2xl group cursor-pointer text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm mb-1 truncate" title={template.name}>
                {template.name}
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                {Object.keys(template.template_data || {}).length} fields
              </p>
              <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewTemplate(template.id)}
                  className="px-2 h-6 text-xs"
                >
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTemplate(template.id)}
                  className="px-2 h-6 text-xs text-blue-600"
                >
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredTemplates.length === 0 && !isLoading && (
        <Card className="p-12 text-center rounded-2xl">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No templates found" : "No templates yet"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? `No templates match "${searchTerm}"` : "Create your first report template to get started"}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          )}
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

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        templateId={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </div>
  );
};
