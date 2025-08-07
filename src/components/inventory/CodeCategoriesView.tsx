import React, { useState } from 'react';
import { Plus, Edit, Trash, Save, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useItemCodeCategories } from "@/hooks/useCompanySettings";

export const CodeCategoriesView: React.FC = () => {
  const queryClient = useQueryClient();
  const { categories, isLoading } = useItemCodeCategories();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ prefix: string; name: string } | null>(null);
  const [newPrefix, setNewPrefix] = useState("");
  const [newName, setNewName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ prefix: string; name: string } | null>(null);

  const updateCategoriesMutation = useMutation({
    mutationFn: async (newCategories: Record<string, string>) => {
      const { data, error } = await supabase
        .from('company_settings')
        .update({ item_code_categories: newCategories })
        .eq('id', (await supabase.from('company_settings').select('id').single()).data?.id);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast.success('Categories updated successfully');
      setShowAddForm(false);
      setEditingCategory(null);
      setNewPrefix("");
      setNewName("");
    },
    onError: (error) => {
      console.error('Error updating categories:', error);
      toast.error('Failed to update categories');
    }
  });

  const handleAddCategory = () => {
    if (!newPrefix || !newName) {
      toast.error('Please provide both prefix and name');
      return;
    }

    // Validate prefix is 4 digits
    if (!/^\d{4}$/.test(newPrefix)) {
      toast.error('Prefix must be exactly 4 digits (e.g., 1000, 2000)');
      return;
    }

    // Get current categories as a plain object
    const currentCategories: Record<string, string> = {};
    categories.forEach(cat => {
      currentCategories[cat.value] = cat.label.split(' - ')[1];
    });

    // Check if prefix already exists
    if (currentCategories[newPrefix]) {
      toast.error('This prefix already exists');
      return;
    }

    const newCategories = {
      ...currentCategories,
      [newPrefix]: newName
    };

    updateCategoriesMutation.mutate(newCategories);
  };

  const handleEditCategory = (prefix: string, newName: string) => {
    const currentCategories: Record<string, string> = {};
    categories.forEach(cat => {
      currentCategories[cat.value] = cat.label.split(' - ')[1];
    });

    const updatedCategories = {
      ...currentCategories,
      [prefix]: newName
    };

    updateCategoriesMutation.mutate(updatedCategories);
  };

  const handleDeleteClick = (prefix: string, name: string) => {
    setCategoryToDelete({ prefix, name });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;

    const currentCategories: Record<string, string> = {};
    categories.forEach(cat => {
      currentCategories[cat.value] = cat.label.split(' - ')[1];
    });

    delete currentCategories[categoryToDelete.prefix];
    updateCategoriesMutation.mutate(currentCategories);
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="p-6">
      <div>
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-medium text-foreground">ID Number Categories</h2>
              <p className="text-muted-foreground mt-2">
                Manage global item ID categories used across all products
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Information Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  <strong>How ID Categories Work:</strong> Each prefix range (1000-1999, 2000-2999, etc.) can have multiple category names. 
                  New individual units automatically get sequential numbers within their category (e.g., 1001, 1002, 1003...).
                </p>
                <p className="mb-2">
                  Categories created here can be assigned to product types in each product's overview tab for organized inventory management.
                </p>
                <p>
                  <strong>Existing Systems:</strong> If you already have a numbering system in place, you can add custom numbers while setting this up to maintain your current organization.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading categories...</div>
          ) : (
            <>
              <div className="space-y-3">
                {categories.map((category) => {
                  const prefix = category.value;
                  const name = category.label.split(' - ')[1];
                  const isEditing = editingCategory?.prefix === prefix;

                  return (
                    <div key={prefix} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-gradient-to-r from-blue-600 to-blue-700 border-blue-600 text-white font-bold font-mono">
                          {prefix}
                        </Badge>
                        {isEditing ? (
                          <Input
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="h-8 max-w-48"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium">{name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                handleEditCategory(prefix, editingCategory.name);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingCategory(null)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingCategory({ prefix, name })}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(prefix, name)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {showAddForm && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-medium">Add New Category</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="prefix">Category Prefix</Label>
                      <Select value={newPrefix} onValueChange={setNewPrefix}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1000">1 - 1000-1999 Range</SelectItem>
                          <SelectItem value="2000">2 - 2000-2999 Range</SelectItem>
                          <SelectItem value="3000">3 - 3000-3999 Range</SelectItem>
                          <SelectItem value="4000">4 - 4000-4999 Range</SelectItem>
                          <SelectItem value="5000">5 - 5000-5999 Range</SelectItem>
                          <SelectItem value="6000">6 - 6000-6999 Range</SelectItem>
                          <SelectItem value="7000">7 - 7000-7999 Range</SelectItem>
                          <SelectItem value="8000">8 - 8000-8999 Range</SelectItem>
                          <SelectItem value="9000">9 - 9000-9999 Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="name">Category Name</Label>
                      <Input
                        id="name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Custom Units"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddCategory} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddForm(false)} size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Deleting the "{categoryToDelete?.name}" category will remove it from the system. This does not affect any existing ID numbers for individual units that have already been assigned, but this category will no longer be available for newly created individual units.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={handleCloseDeleteDialog}
                className="bg-gray-100 text-black hover:bg-gray-200"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                disabled={updateCategoriesMutation.isPending}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
              >
                {updateCategoriesMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};