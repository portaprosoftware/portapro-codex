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
  parent_group: string;
}

export const DocumentCategoryManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DocumentCategory | null>(null);
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [formData, setFormData] = useState<DocumentCategoryFormData>({
    name: "",
    description: "",
    icon: "",
    color: "#3B82F6",
    parent_group: ""
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

  // Group definitions
  const groupDefinitions = [
    {
      id: "maintenance",
      name: "Maintenance & Operations",
      color: "#F97316",
      description: "Work orders, maintenance invoices, fuel receipts"
    },
    {
      id: "compliance",
      name: "Vehicle Ownership & Compliance",
      color: "#3B82F6",
      description: "Registration, insurance, permits, and inspections"
    },
    {
      id: "personnel",
      name: "Driver & Personnel",
      color: "#8B5CF6",
      description: "Driver licenses, training, incidents, and safety"
    },
    {
      id: "equipment",
      name: "Equipment & Asset Management",
      color: "#10B981",
      description: "Manuals, warranties, and purchase agreements"
    },
    {
      id: "photos",
      name: "Photos & Visual Records",
      color: "#6B7280",
      description: "Vehicle photos, job sites, and compliance images"
    },
    {
      id: "financial",
      name: "Financial & Administrative",
      color: "#F59E0B",
      description: "Invoices, receipts, and tax documents"
    },
    {
      id: "other",
      name: "Catch-All / Miscellaneous",
      color: "#64748B",
      description: "Temporary files and uncategorized documents"
    }
  ];

  const createMutation = useMutation({
    mutationFn: async (data: DocumentCategoryFormData) => {
      // Get color from parent group
      const selectedGroup = groupDefinitions.find(g => g.id === data.parent_group);
      const color = selectedGroup?.color || "#3B82F6";
      
      const { error } = await supabase
        .from("document_categories")
        .insert([{
          name: data.name,
          description: data.description,
          icon: data.icon,
          color: color,
          parent_group: data.parent_group,
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
      // Get color from parent group
      const selectedGroup = groupDefinitions.find(g => g.id === data.parent_group);
      const color = selectedGroup?.color || "#3B82F6";
      
      const { error } = await supabase
        .from("document_categories")
        .update({
          name: data.name,
          description: data.description,
          icon: data.icon,
          color: color,
          parent_group: data.parent_group
        })
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
      color: "#3B82F6",
      parent_group: ""
    });
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon,
      color: category.color,
      parent_group: category.parent_group || ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.parent_group) {
      toast({
        title: "Error",
        description: "Please select a parent group",
        variant: "destructive",
      });
      return;
    }
    
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Group categories by parent_group
  const categoryGroups = useMemo(() => {
    const groups = groupDefinitions.map(group => ({
      ...group,
      categories: categories?.filter(cat => cat.parent_group === group.id) || []
    }));
    
    // Filter groups based on selected filter
    if (filterGroup === "all") {
      return groups;
    }
    return groups.filter(g => g.id === filterGroup);
  }, [categories, filterGroup]);

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
        
        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Label htmlFor="filter-group" className="text-sm whitespace-nowrap">Filter:</Label>
            <select
              id="filter-group"
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[200px]"
            >
              <option value="all">All Categories</option>
              {groupDefinitions.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
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
              Add Subcategory
            </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Edit Document Subcategory" : "Add Document Subcategory"}
                </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="parent_group">Parent Group *</Label>
                <select
                  id="parent_group"
                  value={formData.parent_group}
                  onChange={(e) => setFormData({ ...formData, parent_group: e.target.value })}
                  required
                  className="w-full mt-2 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a group...</option>
                  {groupDefinitions.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {formData.parent_group && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {groupDefinitions.find(g => g.id === formData.parent_group)?.description}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., DOT Permit, Annual Registration"
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
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingCategory ? "Update" : "Create"} Subcategory
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
      </div>

      {/* Grouped Categories with Accordion */}
      <Accordion type="multiple" className="space-y-4">
        {categoryGroups.map((group) => (
          <AccordionItem key={group.id} value={group.id} className="border rounded-lg bg-white shadow-sm">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3 flex-1 text-left">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{group.name}</h4>
                    <span className="text-xs text-muted-foreground">
                      ({group.categories.length} {group.categories.length === 1 ? 'subcategory' : 'subcategories'})
                    </span>
                  </div>
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