import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

export const ItemCodeCategorySettings: React.FC = () => {
  const { data: companySettings, isLoading } = useCompanySettings();
  const queryClient = useQueryClient();
  const [newCategoryPrefix, setNewCategoryPrefix] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const updateCategoriesMutation = useMutation({
    mutationFn: async (newCategories: { [key: string]: string }) => {
      const { error } = await supabase
        .from('company_settings')
        .update({ 
          item_code_categories: newCategories,
        })
        .eq('id', companySettings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Item code categories updated successfully');
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
    },
    onError: (error) => {
      console.error('Error updating categories:', error);
      toast.error('Failed to update categories');
    }
  });

  const handleAddCategory = () => {
    if (!newCategoryPrefix || !newCategoryName) {
      toast.error('Please enter both prefix and name');
      return;
    }

    if (!/^\d{4}$/.test(newCategoryPrefix)) {
      toast.error('Prefix must be exactly 4 digits (e.g., 1000, 2000)');
      return;
    }

    const currentCategories = companySettings?.item_code_categories || {};
    
    if (currentCategories[newCategoryPrefix]) {
      toast.error('This prefix already exists');
      return;
    }

    const newCategories = {
      ...currentCategories,
      [newCategoryPrefix]: newCategoryName
    };

    updateCategoriesMutation.mutate(newCategories);
    setNewCategoryPrefix('');
    setNewCategoryName('');
  };

  const handleRemoveCategory = (prefix: string) => {
    const currentCategories = companySettings?.item_code_categories || {};
    const { [prefix]: removed, ...newCategories } = currentCategories;
    updateCategoriesMutation.mutate(newCategories);
  };

  if (isLoading) {
    return <div className="p-4">Loading settings...</div>;
  }

  const categories = companySettings?.item_code_categories || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Item Code Categories
        </CardTitle>
        <CardDescription>
          Configure 4-digit item code categories for your inventory. Each category uses a different range of numbers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Categories */}
        <div>
          <h4 className="font-medium mb-3">Current Categories</h4>
          <div className="space-y-2">
            {Object.entries(categories).map(([prefix, name]) => (
              <div key={prefix} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">
                    {prefix}XXX
                  </Badge>
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">
                      Codes: {prefix}001, {prefix}002, {prefix}003...
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCategory(prefix)}
                  disabled={updateCategoriesMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {Object.keys(categories).length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No categories configured yet. Add your first category below.
              </p>
            )}
          </div>
        </div>

        {/* Add New Category */}
        <div className="border-t pt-6">
          <h4 className="font-medium mb-3">Add New Category</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="prefix">4-Digit Prefix</Label>
              <Input
                id="prefix"
                value={newCategoryPrefix}
                onChange={(e) => setNewCategoryPrefix(e.target.value)}
                placeholder="e.g., 5000"
                maxLength={4}
                pattern="\d{4}"
              />
            </div>
            <div>
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Luxury Units"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddCategory}
                disabled={updateCategoriesMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          </div>
        </div>

        {/* Industry Standard Examples */}
        <div className="border-t pt-6">
          <h4 className="font-medium mb-3">Industry Standard Examples</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p><Badge variant="outline" className="font-mono mr-2">1000</Badge>Standard Portable Toilets</p>
              <p><Badge variant="outline" className="font-mono mr-2">2000</Badge>ADA/Handicap Units</p>
              <p><Badge variant="outline" className="font-mono mr-2">3000</Badge>Luxury/Flushable Units</p>
            </div>
            <div className="space-y-1">
              <p><Badge variant="outline" className="font-mono mr-2">4000</Badge>Holding Tanks</p>
              <p><Badge variant="outline" className="font-mono mr-2">5000</Badge>Mobile Restroom Trailers</p>
              <p><Badge variant="outline" className="font-mono mr-2">6000</Badge>Sink Stations</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
