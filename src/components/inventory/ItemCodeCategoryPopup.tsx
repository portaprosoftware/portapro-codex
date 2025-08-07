import React, { useState } from "react";
import { Settings2, Plus, Edit, Trash, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useItemCodeCategories } from "@/hooks/useCompanySettings";

export const ItemCodeCategoryPopup: React.FC = () => {
  const queryClient = useQueryClient();
  const { categories, isLoading } = useItemCodeCategories();
  const [showDialog, setShowDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
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
      setShowAddDialog(false);
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

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Settings2 className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
          <Settings2 className="w-4 h-4 mr-2" />
          Category Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Item Code Categories
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Manage global item code categories used across all products
            </p>
            <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>

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

          {showAddDialog && (
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
                <Button variant="outline" onClick={() => setShowAddDialog(false)} size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};