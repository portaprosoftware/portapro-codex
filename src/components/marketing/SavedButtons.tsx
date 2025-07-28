import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
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

  const getButtonIcon = (type: string) => {
    switch (type) {
      case 'phone': return '📞';
      case 'email': return '✉️';
      case 'url': return '🔗';
      default: return '🔗';
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
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <span>{getButtonIcon(savedButton.button_type)}</span>
                  {savedButton.button_text}
                </Badge>
                <span className="text-sm text-gray-500 capitalize">
                  {savedButton.button_type}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSelectButton(savedButton)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          No saved buttons yet. Create and save buttons for future use!
        </p>
      )}
    </Card>
  );
};