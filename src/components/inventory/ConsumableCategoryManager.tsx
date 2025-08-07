import React, { useMemo, useState } from 'react';
import { Plus, Edit, Save, Trash, X, Settings2, AlertCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useConsumableCategories, useCompanySettings } from '@/hooks/useCompanySettings';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SuccessMessage } from '@/components/ui/SuccessMessage';
import type { ConsumableCategory } from '@/lib/consumableCategories';

export const ConsumableCategoryManager: React.FC = () => {
  const queryClient = useQueryClient();
  const { categories, isLoading: categoriesLoading } = useConsumableCategories();
  const { data: companySettings } = useCompanySettings();
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Add form state
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Inline edit state
  const [editing, setEditing] = useState<{ value: string; label: string; description?: string } | null>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ConsumableCategory | null>(null);
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [reassignValue, setReassignValue] = useState<string>('');
  const [confirmText, setConfirmText] = useState('');
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [processingDelete, setProcessingDelete] = useState(false);

  // Helpers
  const slugify = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

  const generateUniqueValue = (base: string) => {
    if (!base) return '';
    const existing = new Set((categories || []).map(c => c.value));
    if (!existing.has(base)) return base;
    let i = 2;
    let candidate = `${base}_${i}`;
    while (existing.has(candidate)) {
      i += 1;
      candidate = `${base}_${i}`;
    }
    return candidate;
  };

  const derivedValue = useMemo(() => generateUniqueValue(slugify(newLabel)), [newLabel, categories]);

  const sorted = useMemo(() => {
    return [...(categories || [])].sort((a, b) => a.label.localeCompare(b.label));
  }, [categories]);

  const updateMutation = useMutation({
    mutationFn: async (next: ConsumableCategory[]) => {
      const settingsId =
        companySettings?.id ||
        (await supabase.from('company_settings').select('id').single()).data?.id;

      // Cast to any to bypass generated types until Supabase types include `consumable_categories`
      const { error } = await supabase
        .from('company_settings' as any)
        .update({ consumable_categories: next } as any)
        .eq('id', settingsId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      queryClient.invalidateQueries({ queryKey: ['simple-consumables'] });
      setShowSuccess(true);
      setEditing(null);
      setNewLabel('');
      setNewDescription('');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err?.message || 'Failed updating categories');
    }
  });

  const handleAdd = () => {
    if (!newLabel.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    const value = derivedValue;
    if (!value) {
      toast.error('Could not generate an ID from the name');
      return;
    }
    const next: ConsumableCategory[] = [
      ...(categories || []),
      {
        value,
        label: newLabel.trim(),
        description: newDescription.trim() || '',
        examples: []
      }
    ];
    updateMutation.mutate(next);
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    const next = (categories || []).map(c =>
      c.value === editing.value
        ? {
            ...c,
            label: editing.label.trim(),
            description: editing.description?.trim() || ''
          }
        : c
    );
    updateMutation.mutate(next);
  };

  const openDeleteDialog = async (cat: ConsumableCategory) => {
    setDeleteTarget(cat);
    setDeleteOpen(true);
    setReassignValue('');
    setConfirmText('');
    setUsageCount(null);
    setLoadingUsage(true);
    const { count, error } = await supabase
      .from('consumables')
      .select('*', { count: 'exact', head: true })
      .eq('category', cat.value);
    if (error) {
      console.error(error);
      toast.error('Failed to check category usage');
    } else {
      setUsageCount(count || 0);
    }
    setLoadingUsage(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (confirmText.toLowerCase() !== 'delete') {
      toast.error('Type "delete" to confirm');
      return;
    }
    try {
      setProcessingDelete(true);
      if ((usageCount || 0) > 0) {
        if (!reassignValue) {
          toast.error('Please choose a category to move existing items to');
          setProcessingDelete(false);
          return;
        }
        const { error: updateErr } = await supabase
          .from('consumables')
          .update({ category: reassignValue })
          .eq('category', deleteTarget.value);
        if (updateErr) throw updateErr;
      }

      const next = (categories || []).filter(c => c.value !== deleteTarget.value);
      updateMutation.mutate(next, {
        onSuccess: () => {
          toast.success('Category deleted successfully');
          setDeleteOpen(false);
          setDeleteTarget(null);
          setReassignValue('');
          setConfirmText('');
          setUsageCount(null);
          setProcessingDelete(false);
        },
        onError: () => {
          setProcessingDelete(false);
        }
      });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to delete category');
      setProcessingDelete(false);
    }
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setDeleteTarget(null);
    setReassignValue('');
    setConfirmText('');
    setUsageCount(null);
  };

  const handleCloseMain = () => {
    setOpen(false);
    setEditing(null);
    setNewLabel('');
    setNewDescription('');
  };

  const isFormValid = newLabel.trim().length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <Settings2 className="w-4 h-4 mr-2" />
            Manage Categories
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Consumable Categories Management
            </DialogTitle>
            <DialogDescription>
              Organize your consumables with custom categories. Add, edit, and manage categories to keep your inventory organized.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Category Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Category Name *</Label>
                  <Input 
                    id="category-name"
                    placeholder="e.g., Hand Soap, Paper Towels" 
                    value={newLabel} 
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="mt-1"
                  />
                  {derivedValue && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Internal ID: <span className="font-mono bg-muted px-1 rounded">{derivedValue}</span>
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="category-description">Description (Optional)</Label>
                  <Input 
                    id="category-description"
                    placeholder="Brief description of this category" 
                    value={newDescription} 
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <Button 
                  onClick={handleAdd} 
                  disabled={!isFormValid || updateMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Categories Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Existing Categories ({sorted.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin mr-2" />
                    <span className="text-muted-foreground">Loading categories...</span>
                  </div>
                ) : sorted.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No custom categories yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Add your first category to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {sorted.map(cat => {
                      const isEditing = editing?.value === cat.value;
                      return (
                        <div key={cat.value} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                          <div className="flex items-center gap-3 flex-1">
                            <Badge variant="outline" className="font-mono text-xs shrink-0">{cat.value}</Badge>
                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  value={editing?.label || ''}
                                  onChange={(e) => setEditing({ ...(editing as any), label: e.target.value })}
                                  className="h-8"
                                  autoFocus
                                  placeholder="Category name"
                                />
                                <Input
                                  value={editing?.description || ''}
                                  onChange={(e) => setEditing({ ...(editing as any), description: e.target.value })}
                                  className="h-8"
                                  placeholder="Description"
                                />
                              </div>
                            ) : (
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-medium truncate">{cat.label}</span>
                                {cat.description && <span className="text-xs text-muted-foreground truncate">{cat.description}</span>}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {isEditing ? (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={handleSaveEdit} 
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  disabled={updateMutation.isPending}
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setEditing(null)} 
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
                                  onClick={() => setEditing({ value: cat.value, label: cat.label, description: cat.description })} 
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => openDeleteDialog(cat)} 
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleCloseMain}>
              Close
            </Button>
          </div>

          {/* Delete Category Dialog */}
          <Dialog open={deleteOpen} onOpenChange={(v) => { if (!v) handleCloseDelete(); }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-red-600">Delete Category</DialogTitle>
                <DialogDescription>
                  {deleteTarget ? `You are about to delete "${deleteTarget.label}". This action cannot be undone.` : ''}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {loadingUsage ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader className="w-4 h-4 animate-spin" />
                    Checking category usage...
                  </div>
                ) : (
                  <>
                    {usageCount !== null && usageCount > 0 ? (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <span className="font-medium text-orange-900">Category In Use</span>
                        </div>
                        <p className="text-sm text-orange-800 mb-3">
                          This category is used by <span className="font-medium">{usageCount}</span> item{usageCount === 1 ? '' : 's'}. 
                          Please choose a category to move them to before deletion.
                        </p>
                        <div>
                          <Label>Move items to:</Label>
                          <Select value={reassignValue} onValueChange={setReassignValue}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select new category" />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-white">
                              {(categories || [])
                                .filter(c => c.value !== deleteTarget?.value)
                                .sort((a, b) => a.label.localeCompare(b.label))
                                .map(c => (
                                  <SelectItem key={c.value} value={c.value}>
                                    {c.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <span className="font-medium text-green-900">Safe to Delete</span>
                        </div>
                        <p className="text-sm text-green-800 mt-1">
                          No items are using this category. It can be safely deleted.
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <Label>Type "delete" to confirm</Label>
                  <Input 
                    value={confirmText} 
                    onChange={(e) => setConfirmText(e.target.value)} 
                    placeholder="delete" 
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseDelete}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  disabled={
                    processingDelete ||
                    confirmText.toLowerCase() !== 'delete' ||
                    (usageCount !== null && usageCount > 0 && !reassignValue)
                  }
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
                >
                  {processingDelete ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Category'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>

      {showSuccess && (
        <SuccessMessage 
          message="Category updated successfully!" 
          onComplete={() => setShowSuccess(false)}
        />
      )}
    </>
  );
};
