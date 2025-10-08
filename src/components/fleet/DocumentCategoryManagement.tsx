import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

interface DocumentCategoryFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const DocumentCategoryManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DocumentCategory | null>(null);
  const [formData, setFormData] = useState<DocumentCategoryFormData>({
    name: "",
    description: "",
    icon: "",
    color: "#3B82F6"
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["document-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_categories")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DocumentCategoryFormData) => {
      const { error } = await supabase
        .from("document_categories")
        .insert([{
          ...data,
          display_order: (categories?.length || 0) + 1
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-categories"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Document category created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create document category.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DocumentCategoryFormData }) => {
      const { error } = await supabase
        .from("document_categories")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-categories"] });
      setIsDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      toast({
        title: "Success",
        description: "Document category updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update document category.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("document_categories")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-categories"] });
      toast({
        title: "Success",
        description: "Document category deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document category.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "",
      color: "#3B82F6"
    });
  };

  const handleEdit = (category: DocumentCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon,
      color: category.color
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const colorOptions = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#06B6D4", // Cyan
    "#F97316", // Orange
    "#84CC16", // Lime
  ];

  // Group categories by color/group
  const categoryGroups = useMemo(() => {
    const groups = [
      {
        id: "maintenance",
        name: "Maintenance & Operations",
        color: "#F97316", // Orange
        description: "Work orders, maintenance invoices, fuel receipts",
        categoryNames: [
          "Maintenance & Repairs",
          "Fuel Receipts",
          "Inspection Reports",
          "Service Records",
          "Work Orders"
        ]
      },
      {
        id: "compliance",
        name: "Vehicle Ownership & Compliance",
        color: "#3B82F6", // Blue
        description: "Registration, insurance, permits, and inspections",
        categoryNames: [
          "Registration",
          "Title / Ownership",
          "Insurance",
          "Emissions & Inspection Certificates",
          "Permits & Licensing"
        ]
      },
      {
        id: "personnel",
        name: "Driver & Personnel",
        color: "#8B5CF6", // Purple
        description: "Driver licenses, training, incidents, and safety",
        categoryNames: [
          "Driver License & ID",
          "Training Certificates",
          "Accident / Incident Reports",
          "Disciplinary / Safety Records"
        ]
      },
      {
        id: "equipment",
        name: "Equipment & Asset Management",
        color: "#10B981", // Green
        description: "Manuals, warranties, and purchase agreements",
        categoryNames: [
          "Equipment Manuals",
          "Warranty Documents",
          "Purchase / Lease Agreements",
          "Upfit / Modification Docs"
        ]
      },
      {
        id: "photos",
        name: "Photos & Visual Records",
        color: "#6B7280", // Gray
        description: "Vehicle photos, job sites, and compliance images",
        categoryNames: [
          "Vehicle Photos",
          "Job Site Photos",
          "Compliance Photos"
        ]
      },
      {
        id: "financial",
        name: "Financial & Administrative",
        color: "#F59E0B", // Amber
        description: "Invoices, receipts, and tax documents",
        categoryNames: [
          "Invoices & Receipts",
          "Purchase Orders",
          "Tax Documents",
          "Contracts & Agreements"
        ]
      },
      {
        id: "other",
        name: "Catch-All / Miscellaneous",
        color: "#64748B", // Slate
        description: "Temporary files and uncategorized documents",
        categoryNames: [
          "Other Documents",
          "Temporary / Draft Files"
        ]
      }
    ];

    return groups.map(group => ({
      ...group,
      categories: categories?.filter(cat => group.categoryNames.includes(cat.name)) || []
    }));
  }, [categories]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Document Categories</h3>
          <p className="text-sm text-gray-600">Manage document types and their display settings</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingCategory(null);
                resetForm();
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Document Category" : "Add Document Category"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Receipt, Warranty, Photo"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description of this category"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-full h-10 rounded-md transition-all ${
                        formData.color === color 
                          ? 'border-4 border-gray-900 ring-2 ring-offset-2 ring-gray-900' 
                          : 'border-2 border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingCategory ? "Update" : "Create"} Category
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grouped Categories with Accordion */}
      <Accordion type="multiple" defaultValue={categoryGroups.map(g => g.id)} className="space-y-4">
        {categoryGroups.map((group) => (
          <AccordionItem key={group.id} value={group.id} className="border rounded-lg bg-white shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3 flex-1 text-left">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{group.name}</h4>
                  <p className="text-sm text-gray-600 mt-0.5">{group.description}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className="space-y-3 pt-3">
                {group.categories.map((category) => (
                  <Card key={category.id} className="p-4 bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full border flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <h5 className="font-medium text-gray-900">{category.name}</h5>
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-600 mt-2 ml-6">{category.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Document Category</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{category.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(category.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {group.categories.length === 0 && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No categories in this group yet
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      {categories?.length === 0 && (
        <Card className="p-8 text-center">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No document categories found</h3>
          <p className="text-gray-600 mb-4">Create your first document category to start organizing your files.</p>
        </Card>
      )}
    </div>
  );
};