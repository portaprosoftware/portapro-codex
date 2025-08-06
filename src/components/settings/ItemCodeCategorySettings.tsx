import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

    // Convert single digit to 4-digit format (e.g., "1" -> "1000")
    const fullPrefix = newCategoryPrefix.padStart(1, '0') + '000';

    const currentCategories = companySettings?.item_code_categories || {};
    
    // Allow reuse of prefixes - just add the new category with a unique key
    const existingEntries = Object.entries(currentCategories);
    const existingWithSamePrefix = existingEntries.filter(([key]) => key.startsWith(newCategoryPrefix));
    
    // Create a unique key by adding a suffix if needed
    let finalKey = fullPrefix;
    if (existingWithSamePrefix.length > 0) {
      // Find the next available suffix
      const suffixes = existingWithSamePrefix.map(([key]) => {
        const match = key.match(new RegExp(`^${newCategoryPrefix}000-?(\\d*)$`));
        return match ? (match[1] ? parseInt(match[1]) : 0) : -1;
      }).filter(n => n >= 0);
      
      const nextSuffix = suffixes.length > 0 ? Math.max(...suffixes) + 1 : 1;
      finalKey = `${fullPrefix}-${nextSuffix}`;
    }

    const newCategories = {
      ...currentCategories,
      [finalKey]: newCategoryName
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
          Configure item code categories using prefixes 1-9. Each prefix generates 4-digit codes (1000-9999). Prefixes can be reused for multiple product types.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Categories */}
        <div>
          <h4 className="font-medium mb-3">Current Categories</h4>
          <div className="space-y-2">
            {Object.entries(categories).map(([prefix, name]) => {
              const displayPrefix = prefix.substring(0, 1); // Show just the first digit
              const startCode = prefix.replace(/-\d+$/, ''); // Remove suffix for display
              return (
                <div key={prefix} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      {displayPrefix}XXX
                    </Badge>
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-sm text-muted-foreground">
                        Codes: {startCode}1, {startCode}2, {startCode}3...
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
              );
            })}
            
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
              <Label htmlFor="prefix">Prefix (1-9)</Label>
              <Select value={newCategoryPrefix} onValueChange={setNewCategoryPrefix}>
                <SelectTrigger>
                  <SelectValue placeholder="Select prefix" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} (generates {num}000-{num}999)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <h4 className="font-medium mb-3">Examples</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p><Badge variant="outline" className="font-mono mr-2">1</Badge>Standard Portable Toilets (1000-1999)</p>
              <p><Badge variant="outline" className="font-mono mr-2">2</Badge>ADA/Handicap Units (2000-2999)</p>
              <p><Badge variant="outline" className="font-mono mr-2">3</Badge>Luxury/Flushable Units (3000-3999)</p>
            </div>
            <div className="space-y-1">
              <p><Badge variant="outline" className="font-mono mr-2">4</Badge>Holding Tanks (4000-4999)</p>
              <p><Badge variant="outline" className="font-mono mr-2">5</Badge>Mobile Restroom Trailers (5000-5999)</p>
              <p><Badge variant="outline" className="font-mono mr-2">6</Badge>Sink Stations (6000-6999)</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
