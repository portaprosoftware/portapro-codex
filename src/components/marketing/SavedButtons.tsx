import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CustomButton {
  id: string;
  text: string;
  type: 'url' | 'phone' | 'email';
  value: string;
  style: 'primary' | 'secondary';
  includeEmoji?: boolean;
}

interface SavedButtonsProps {
  onSelectButton: (button: CustomButton) => void;
}

export const SavedButtons: React.FC<SavedButtonsProps> = ({ onSelectButton }) => {
  const [editingButton, setEditingButton] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    button_text: '',
    button_type: 'url' as 'url' | 'phone' | 'email',
    button_value: '',
    button_style: 'primary' as 'primary' | 'secondary'
  });

  const queryClient = useQueryClient();

  const { data: savedButtons, isLoading } = useQuery({
    queryKey: ['saved-buttons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_buttons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const updateButtonMutation = useMutation({
    mutationFn: async (updatedButton: any) => {
      const { error } = await supabase
        .from('saved_buttons')
        .update({
          button_text: updatedButton.button_text,
          button_type: updatedButton.button_type,
          button_value: updatedButton.button_value,
          button_style: updatedButton.button_style
        })
        .eq('id', updatedButton.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-buttons'] });
      setEditingButton(null);
      toast({ title: 'Button updated successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to update button', variant: 'destructive' });
    }
  });

  const deleteButtonMutation = useMutation({
    mutationFn: async (buttonId: string) => {
      const { error } = await supabase
        .from('saved_buttons')
        .delete()
        .eq('id', buttonId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-buttons'] });
      toast({ title: 'Button deleted successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to delete button', variant: 'destructive' });
    }
  });

  const getButtonIcon = (type: string) => {
    switch (type) {
      case 'phone': return '📞';
      case 'email': return '✉️';
      case 'url': return '🔗';
      default: return '🔗';
    }
  };

  const handleEditButton = (savedButton: any) => {
    setEditingButton(savedButton);
    setEditForm({
      button_text: savedButton.button_text,
      button_type: savedButton.button_type,
      button_value: savedButton.button_value,
      button_style: savedButton.button_style || 'primary'
    });
  };

  const handleSaveEdit = () => {
    updateButtonMutation.mutate({
      ...editingButton,
      ...editForm
    });
  };

  const handleDeleteButton = (buttonId: string) => {
    if (window.confirm('Are you sure you want to delete this saved button?')) {
      deleteButtonMutation.mutate(buttonId);
    }
  };

  const formatButtonValue = (type: string, value: string) => {
    if (type === 'phone') {
      return value;
    } else if (type === 'email') {
      return value;
    } else {
      // For URLs, show a shortened version
      try {
        const url = new URL(value);
        return url.hostname;
      } catch {
        return value.length > 30 ? value.substring(0, 30) + '...' : value;
      }
    }
  };

  const handleSelectButton = (savedButton: any) => {
    const button: CustomButton = {
      id: Date.now().toString(),
      text: savedButton.button_text,
      type: savedButton.button_type,
      value: savedButton.button_value,
      style: savedButton.button_style || 'primary',
      includeEmoji: true // Default to include emoji for saved buttons
    };

    onSelectButton(button);
    toast({ title: 'Button added to message!' });
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <h4 className="font-medium mb-4 font-inter">Saved Buttons</h4>
        <p className="text-sm text-gray-500">Loading saved buttons...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h4 className="font-medium mb-4 font-inter">Saved Buttons</h4>
      
      {savedButtons && savedButtons.length > 0 ? (
        <div className="space-y-2">
          {savedButtons.map((savedButton) => (
            <div
              key={savedButton.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                  <span>{getButtonIcon(savedButton.button_type)}</span>
                  {savedButton.button_text}
                </Badge>
                <div className="text-sm text-gray-500 min-w-0">
                  <div className="capitalize">{savedButton.button_type}</div>
                  <div className="truncate text-xs">
                    {formatButtonValue(savedButton.button_type, savedButton.button_value)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditButton(savedButton)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteButton(savedButton.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSelectButton(savedButton)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          No saved buttons yet. Create and save buttons for future use!
        </p>
      )}

      {/* Edit Button Modal */}
      <Dialog open={!!editingButton} onOpenChange={() => setEditingButton(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Saved Button</DialogTitle>
          </DialogHeader>
          
          {editingButton && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-button-text">Button Text</Label>
                <Input
                  id="edit-button-text"
                  value={editForm.button_text}
                  onChange={(e) => setEditForm(prev => ({ ...prev, button_text: e.target.value }))}
                  placeholder="e.g., Call Now"
                />
              </div>

              <div>
                <Label htmlFor="edit-button-type">Type</Label>
                <Select 
                  value={editForm.button_type} 
                  onValueChange={(value: 'url' | 'phone' | 'email') => 
                    setEditForm(prev => ({ ...prev, button_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">Website URL</SelectItem>
                    <SelectItem value="phone">Phone Number</SelectItem>
                    <SelectItem value="email">Email Address</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-button-value">
                  {editForm.button_type === 'url' ? 'URL' : 
                   editForm.button_type === 'phone' ? 'Phone Number' : 'Email Address'}
                </Label>
                <Input
                  id="edit-button-value"
                  value={editForm.button_value}
                  onChange={(e) => setEditForm(prev => ({ ...prev, button_value: e.target.value }))}
                  placeholder={
                    editForm.button_type === 'url' ? 'https://example.com' :
                    editForm.button_type === 'phone' ? '(555) 123-4567' : 'contact@example.com'
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit-button-style">Style</Label>
                <Select 
                  value={editForm.button_style} 
                  onValueChange={(value: 'primary' | 'secondary') => 
                    setEditForm(prev => ({ ...prev, button_style: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSaveEdit}
                  disabled={!editForm.button_text.trim() || !editForm.button_value.trim() || updateButtonMutation.isPending}
                  className="flex-1"
                >
                  {updateButtonMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingButton(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};