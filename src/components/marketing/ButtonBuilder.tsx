import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Save } from 'lucide-react';
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

interface ButtonBuilderProps {
  onAddButton: (button: CustomButton) => void;
}

export const ButtonBuilder: React.FC<ButtonBuilderProps> = ({ onAddButton }) => {
  const [buttonData, setButtonData] = useState({
    text: '',
    type: 'url' as const,
    value: '',
    style: 'primary' as const,
    includeEmoji: true
  });

  const getButtonIcon = (type: string) => {
    switch (type) {
      case 'phone': return '📞';
      case 'email': return '✉️';
      case 'url': return '🔗';
      default: return '🔗';
    }
  };

  const isFormValid = () => {
    return buttonData.text.trim() && buttonData.value.trim();
  };

  const handleAddButton = () => {
    if (!isFormValid()) {
      toast({ 
        title: 'Please fill in all fields', 
        description: 'Button text and data are required',
        variant: 'destructive' 
      });
      return;
    }

    const newButton: CustomButton = {
      id: Date.now().toString(),
      text: buttonData.text,
      type: buttonData.type,
      value: buttonData.value,
      style: buttonData.style,
      includeEmoji: buttonData.includeEmoji
    };

    onAddButton(newButton);
    
    // Reset form
    setButtonData({
      text: '',
      type: 'url',
      value: '',
      style: 'primary',
      includeEmoji: true
    });

    toast({ title: 'Button added successfully!' });
  };

  const handleSaveButton = async () => {
    if (!isFormValid()) {
      toast({ 
        title: 'Please fill in all fields', 
        description: 'Button text and data are required',
        variant: 'destructive' 
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('saved_buttons')
        .insert({
          name: `${buttonData.text} (${buttonData.type})`,
          button_text: buttonData.text,
          button_type: buttonData.type,
          button_value: buttonData.value,
          button_style: buttonData.style
        });

      if (error) throw error;

      toast({ title: 'Button saved for future use!' });
    } catch (error) {
      console.error('Error saving button:', error);
      toast({ 
        title: 'Failed to save button',
        variant: 'destructive' 
      });
    }
  };

  const getPlaceholder = () => {
    if (buttonData.type === 'url') return 'https://example.com';
    if (buttonData.type === 'phone') return '(555) 123-4567';
    if (buttonData.type === 'email') return 'contact@example.com';
    return '';
  };

  const getDataLabel = () => {
    if (buttonData.type === 'url') return 'URL';
    if (buttonData.type === 'phone') return 'Phone Number';
    if (buttonData.type === 'email') return 'Email Address';
    return 'Data';
  };

  return (
    <Card className="p-4 border-dashed">
      <h4 className="font-medium mb-4 font-inter">Create New Button</h4>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Button Text</Label>
            <Input
              value={buttonData.text}
              onChange={(e) => setButtonData(prev => ({ ...prev, text: e.target.value }))}
              placeholder="e.g., Call Now"
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select 
              value={buttonData.type} 
              onValueChange={(value: any) => setButtonData(prev => ({ ...prev, type: value }))}
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
        </div>

        <div>
          <Label>{getDataLabel()}</Label>
          <Input
            value={buttonData.value}
            onChange={(e) => setButtonData(prev => ({ ...prev, value: e.target.value }))}
            placeholder={getPlaceholder()}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="includeEmoji"
            checked={buttonData.includeEmoji}
            onCheckedChange={(checked) => setButtonData(prev => ({ ...prev, includeEmoji: !!checked }))}
          />
          <Label htmlFor="includeEmoji" className="text-sm">
            Include emoji {getButtonIcon(buttonData.type)}
          </Label>
        </div>

        {/* Preview */}
        {(buttonData.text || buttonData.value) && (
          <div>
            <Label className="text-sm text-gray-500">Preview</Label>
            <div className="mt-1">
              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                {buttonData.includeEmoji && <span>{getButtonIcon(buttonData.type)}</span>}
                {buttonData.text || 'Button Text'}
              </Badge>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleAddButton}
            disabled={!isFormValid()}
            size="sm"
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add to Message
          </Button>
          <Button
            onClick={handleSaveButton}
            disabled={!isFormValid()}
            size="sm"
            variant="outline"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Button
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Select "Add to Message" to insert this button into your current template.</p>
          <p>Select "Save Button" to add it to your quick‑access list.</p>
        </div>
      </div>
    </Card>
  );
};