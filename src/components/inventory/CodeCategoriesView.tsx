import React, { useState } from 'react';
import { Plus, Edit, Trash, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const handleDeleteCategory = (prefix: string) => {
    const currentCategories: Record<string, string> = {};
    categories.forEach(cat => {
      currentCategories[cat.value] = cat.label.split(' - ')[1];
    });

    delete currentCategories[prefix];
    updateCategoriesMutation.mutate(currentCategories);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-foreground">ID Number Categories</h2>
          <p className="text-muted-foreground mt-2">
            Manage all your item ID number categories and prefixes in one place
          </p>
        </div>
        
        <Card>
          <CardHeader className="text-left">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>ID Number Categories</CardTitle>
                <CardDescription>
                  Manage global item ID categories used across all products
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
                          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 font-mono">
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
                                onClick={() => handleDeleteCategory(prefix)}
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
                        <Label htmlFor="prefix">Category Prefix (4 digits)</Label>
                        <Input
                          id="prefix"
                          value={newPrefix}
                          onChange={(e) => setNewPrefix(e.target.value)}
                          placeholder="5000"
                          maxLength={4}
                        />
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};