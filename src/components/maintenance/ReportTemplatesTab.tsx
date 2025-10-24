
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EnhancedTemplateBuilder } from "./template-builder/EnhancedTemplateBuilder";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import { Plus, FileText, Edit, Trash2, Search, Grid, List, MoreVertical, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [viewMode, setViewMode] = useState<"list" | "icons">("list");
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState<string | null>(null);

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
    <div className="space-y-4 lg:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4">
        {/* Title + View Toggle Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Report Templates</h2>
            <p className="text-sm lg:text-base text-gray-600">Create and manage service report templates</p>
          </div>
          
          {/* Desktop View Toggle */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="px-3"
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "icons" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("icons")}
                className="px-3"
                aria-label="Grid view"
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile: Create Template + Search */}
        <div className="lg:hidden space-y-3">
          <Button
            onClick={() => setIsCreating(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold border-0 hover:from-blue-700 hover:to-blue-800 min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search templates by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 min-h-[44px]"
            aria-label="Search templates"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mobile View Toggle + Desktop Create Button */}
        <div className="flex items-center gap-3">
          <div className="lg:hidden flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="px-3 min-h-[44px]"
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "icons" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("icons")}
              className="px-3 min-h-[44px]"
              aria-label="Grid view"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Desktop Create Button */}
          <Button
            onClick={() => setIsCreating(true)}
            className="hidden lg:flex bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold border-0 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>


      {/* Templates Display */}
      {viewMode === "list" ? (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow" role="article" aria-labelledby={`template-${template.id}`}>
                <div className="space-y-3 min-h-[84px] flex flex-col justify-between">
                  {/* Title + 3-dot Menu */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 id={`template-${template.id}`} className="font-semibold text-base text-gray-900 truncate">{template.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs" aria-label={`Contains ${Object.keys(template.template_data || {}).length} fields`}>
                            {Object.keys(template.template_data || {}).length} fields
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0 h-10 w-10">
                          <MoreVertical className="h-5 w-5" />
                          <span className="sr-only">Open actions for {template.name}</span>
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="rounded-t-2xl">
                        <SheetHeader>
                          <SheetTitle className="text-left">{template.name}</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-2">
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-14 text-base"
                            onClick={() => setPreviewTemplate(template.id)}
                            role="menuitem"
                          >
                            <FileText className="h-5 w-5 mr-3" />
                            Preview
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-14 text-base"
                            onClick={() => setSelectedTemplate(template.id)}
                            role="menuitem"
                          >
                            <Edit className="h-5 w-5 mr-3" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-14 text-base text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteConfirmTemplate(template.id)}
                            role="menuitem"
                          >
                            <Trash2 className="h-5 w-5 mr-3" />
                            Delete
                          </Button>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  {/* Description */}
                  {template.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                  )}

                  {/* Meta Row */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="w-3 h-3" />
                    <span>Template</span>
                    <span>•</span>
                    <span>Last edited {new Date(template.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop List View */}
          <div className="hidden lg:block space-y-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow rounded-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          {Object.keys(template.template_data || {}).length} fields
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{template.description || "No description provided"}</p>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>Template</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Last edited {new Date(template.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPreviewTemplate(template.id)}
                    >
                      Preview
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => setDeleteConfirmTemplate(template.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="p-4 lg:p-6 hover:shadow-lg transition-all duration-200 lg:hover:scale-105 rounded-xl lg:rounded-2xl group" role="article" aria-labelledby={`template-grid-${template.id}`}>
              <div className="text-center">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full mx-auto mb-3 lg:mb-4 flex items-center justify-center">
                  <FileText className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
                </div>
                <h3 id={`template-grid-${template.id}`} className="font-semibold text-sm lg:text-base text-gray-900 mb-2 truncate">{template.name}</h3>
                <Badge variant="outline" className="text-xs mb-3" aria-label={`Contains ${Object.keys(template.template_data || {}).length} fields`}>
                  {Object.keys(template.template_data || {}).length} fields
                </Badge>
                <p className="text-xs lg:text-sm text-gray-600 mb-3 lg:mb-4 line-clamp-2">{template.description || "No description provided"}</p>
                <div className="space-y-2 mb-3 lg:mb-4">
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <FileText className="w-3 h-3" />
                    <span>Template</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <span>Last edited {new Date(template.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Mobile: 3-dot menu */}
                <div className="lg:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full min-h-[44px]">
                        <MoreVertical className="h-4 w-4 mr-2" />
                        Actions
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-2xl">
                      <SheetHeader>
                        <SheetTitle className="text-left">{template.name}</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6 space-y-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-14 text-base"
                          onClick={() => setPreviewTemplate(template.id)}
                        >
                          <FileText className="h-5 w-5 mr-3" />
                          Preview
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-14 text-base"
                          onClick={() => setSelectedTemplate(template.id)}
                        >
                          <Edit className="h-5 w-5 mr-3" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-14 text-base text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteConfirmTemplate(template.id)}
                        >
                          <Trash2 className="h-5 w-5 mr-3" />
                          Delete
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Desktop: Hover buttons */}
                <div className="hidden lg:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setPreviewTemplate(template.id)}
                  >
                    Preview
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleteConfirmTemplate(template.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}


      {/* Empty State */}
      {filteredTemplates.length === 0 && !isLoading && (
        <Card className="p-8 lg:p-12 text-center rounded-xl lg:rounded-2xl">
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" />
          </div>
          <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No templates found" : "No templates yet"}
          </h3>
          <p className="text-sm lg:text-base text-gray-600 mb-4">
            {searchTerm ? `No templates match "${searchTerm}"` : "Create your first report template to get started"}
          </p>
          {searchTerm && (
            <Button
              variant="outline"
              onClick={() => setSearchTerm('')}
              className="mb-4"
            >
              Clear search
            </Button>
          )}
          {!searchTerm && (
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold border-0 hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          )}
        </Card>
      )}

      {/* Enhanced Template Builder */}
      <EnhancedTemplateBuilder
        isOpen={!!selectedTemplate || isCreating}
        onClose={() => {
          setSelectedTemplate(null);
          setIsCreating(false);
        }}
        onSave={(template) => {
          console.log('Template saved:', template);
          queryClient.invalidateQueries({ queryKey: ["maintenance-report-templates"] });
          setSelectedTemplate(null);
          setIsCreating(false);
          toast.success("Template saved successfully");
        }}
      />

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        templateId={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmTemplate} onOpenChange={(open) => !open && setDeleteConfirmTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmTemplate) {
                  deleteMutation.mutate(deleteConfirmTemplate);
                  setDeleteConfirmTemplate(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
