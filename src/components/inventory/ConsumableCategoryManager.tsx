
import React, { useMemo, useState } from 'react';
import { Plus, Edit, Save, Trash, X, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useConsumableCategories, useCompanySettings } from '@/hooks/useCompanySettings';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ConsumableCategory } from '@/lib/consumableCategories';

export const ConsumableCategoryManager: React.FC = () => {
  const queryClient = useQueryClient();
  const { categories } = useConsumableCategories();
  const { data: companySettings } = useCompanySettings();
  const [open, setOpen] = useState(false);

  // Add form
  const [newSlug, setNewSlug] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Inline edit state
  const [editing, setEditing] = useState<{ value: string; label: string; description?: string } | null>(null);

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
      toast.success('Categories updated');
      setEditing(null);
      setNewSlug('');
      setNewLabel('');
      setNewDescription('');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err?.message || 'Failed updating categories');
    }
  });

  const handleAdd = () => {
    if (!newSlug || !newLabel) {
      toast.error('Please provide both a slug and a name');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(newSlug)) {
      toast.error('Slug can only contain lowercase letters, numbers, and underscores');
      return;
    }
    const exists = (categories || []).some(c => c.value === newSlug);
    if (exists) {
      toast.error('A category with this slug already exists');
      return;
    }
    const next: ConsumableCategory[] = [
      ...(categories || []),
      {
        value: newSlug,
        label: newLabel,
        description: newDescription || '',
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
            label: editing.label,
            description: editing.description || ''
          }
        : c
    );
    updateMutation.mutate(next);
  };

  const handleDelete = (value: string) => {
    const next = (categories || []).filter(c => c.value !== value);
    updateMutation.mutate(next);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
          <Settings2 className="w-4 h-4 mr-2" />
          Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Consumable Categories
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" placeholder="e.g. hand_soap" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="label">Name</Label>
                  <Input id="label" placeholder="Hand Soap" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="desc">Description (optional)</Label>
                  <Input id="desc" placeholder="Short description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
                </div>
              </div>
              <div className="mt-3">
                <Button onClick={handleAdd} disabled={updateMutation.isPending} className="bg-gradient-to-r from-blue-700 to-blue-800 text-white hover:from-blue-800 hover:to-blue-900">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {sorted.map(cat => {
              const isEditing = editing?.value === cat.value;
              return (
                <div key={cat.value} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">{cat.value}</Badge>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editing?.label || ''}
                          onChange={(e) => setEditing({ ...(editing as any), label: e.target.value })}
                          className="h-8 w-48"
                          autoFocus
                        />
                        <Input
                          value={editing?.description || ''}
                          onChange={(e) => setEditing({ ...(editing as any), description: e.target.value })}
                          className="h-8 w-64"
                          placeholder="Description"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-medium">{cat.label}</span>
                        {cat.description ? <span className="text-xs text-muted-foreground">{cat.description}</span> : null}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={handleSaveEdit} className="h-8 w-8 p-0">
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditing(null)} className="h-8 w-8 p-0">
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => setEditing({ value: cat.value, label: cat.label, description: cat.description })} className="h-8 w-8 p-0">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.value)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                          <Trash className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
