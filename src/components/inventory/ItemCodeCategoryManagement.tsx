import React, { useState } from "react";
import { Settings2, Plus, Edit, Trash, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useItemCodeCategories } from "@/hooks/useCompanySettings";

export const ItemCodeCategoryManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { categories, isLoading } = useItemCodeCategories();
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

    const currentCategories = categories.reduce((acc, cat) => {
      acc[cat.value] = cat.label.split(' - ')[1];
      return acc;
    }, {} as Record<string, string>);

    if (currentCategories[newPrefix]) {
      toast.error('Prefix already exists');
      return;
    }

    const updatedCategories = {
      ...currentCategories,
      [newPrefix]: newName
    };

    updateCategoriesMutation.mutate(updatedCategories);
  };

  const handleEditCategory = (prefix: string, name: string) => {
    const currentCategories = categories.reduce((acc, cat) => {
      acc[cat.value] = cat.label.split(' - ')[1];
      return acc;
    }, {} as Record<string, string>);

    const updatedCategories = {
      ...currentCategories,
      [prefix]: name
    };

    updateCategoriesMutation.mutate(updatedCategories);
  };

  const handleDeleteCategory = (prefix: string) => {
    const currentCategories = categories.reduce((acc, cat) => {
      acc[cat.value] = cat.label.split(' - ')[1];
      return acc;
    }, {} as Record<string, string>);

    delete currentCategories[prefix];
    updateCategoriesMutation.mutate(currentCategories);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Item Code Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading categories...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Item Code Categories
            </CardTitle>
            <CardDescription>
              Manage global item code categories used across all products
            </CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prefix">Category Prefix (e.g., 5000)</Label>
                  <Input
                    id="prefix"
                    value={newPrefix}
                    onChange={(e) => setNewPrefix(e.target.value)}
                    placeholder="5000"
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
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCategory}>
                    Add Category
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categories.map((category) => {
            const prefix = category.value;
            const name = category.label.split(' - ')[1];
            const isEditing = editingCategory?.prefix === prefix;

            return (
              <div key={prefix} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">
                    {prefix}
                  </Badge>
                  {isEditing ? (
                    <Input
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      className="w-48"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleEditCategory(prefix, editingCategory.name);
                        }
                        if (e.key === 'Escape') {
                          setEditingCategory(null);
                        }
                      }}
                    />
                  ) : (
                    <span className="font-medium">{name}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {category.description}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditCategory(prefix, editingCategory.name)}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingCategory(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingCategory({ prefix, name })}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(prefix)}
                        className="text-red-600 hover:text-red-700"
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
      </CardContent>
    </Card>
  );
};