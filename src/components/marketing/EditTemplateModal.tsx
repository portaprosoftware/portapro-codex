import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

interface Template {
  id: string;
  name: string;
  type: 'email' | 'sms';
  subject?: string;
  content: string;
  category: string;
  source: string;
  is_active: boolean;
  created_at: string;
}

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
}

interface TemplateData {
  name: string;
  type: 'email' | 'sms';
  category: string;
  subject: string;
  content: string;
}

export const EditTemplateModal: React.FC<EditTemplateModalProps> = ({ isOpen, onClose, template }) => {
  const [templateData, setTemplateData] = useState<TemplateData>({
    name: '',
    type: 'email',
    category: 'other',
    subject: '',
    content: ''
  });

  const queryClient = useQueryClient();

  // Populate form when template changes
  useEffect(() => {
    if (template) {
      setTemplateData({
        name: template.name,
        type: template.type,
        category: template.category,
        subject: template.subject || '',
        content: template.content
      });
    }
  }, [template]);

  const updateTemplateMutation = useMutation({
    mutationFn: async (data: TemplateData) => {
      if (!template) throw new Error('No template to update');
      
      const { error } = await supabase
        .from('communication_templates')
        .update({
          name: data.name,
          type: data.type,
          category: data.category,
          subject: data.type === 'email' ? data.subject : null,
          content: data.content
        })
        .eq('id', template.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] });
      toast({ title: 'Template updated successfully!' });
      onClose();
    },
    onError: (error) => {
      console.error('Error updating template:', error);
      toast({ title: 'Error updating template', variant: 'destructive' });
    }
  });

  const handleSubmit = () => {
    if (!templateData.name || !templateData.content) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    if (templateData.type === 'email' && !templateData.subject) {
      toast({ title: 'Email templates require a subject', variant: 'destructive' });
      return;
    }

    updateTemplateMutation.mutate(templateData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" aria-describedby="edit-template-description">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
        </DialogHeader>
        
        <div id="edit-template-description" className="sr-only">
          Edit communication template details and content
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-template-name">Template Name *</Label>
              <Input
                id="edit-template-name"
                value={templateData.name}
                onChange={(e) => setTemplateData({...templateData, name: e.target.value})}
                placeholder="Enter template name"
                disabled={template?.source === 'system'}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-template-type">Type *</Label>
              <Select 
                value={templateData.type} 
                onValueChange={(value: 'email' | 'sms') => setTemplateData({...templateData, type: value})}
                disabled={template?.source === 'system'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-template-category">Category</Label>
            <Select 
              value={templateData.category} 
              onValueChange={(value) => setTemplateData({...templateData, category: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {templateData.type === 'email' && (
            <div>
              <Label htmlFor="edit-template-subject">Subject *</Label>
              <Input
                id="edit-template-subject"
                value={templateData.subject}
                onChange={(e) => setTemplateData({...templateData, subject: e.target.value})}
                placeholder="Enter email subject"
              />
            </div>
          )}

          <div>
            <Label htmlFor="edit-template-content">Content *</Label>
            <Textarea
              id="edit-template-content"
              value={templateData.content}
              onChange={(e) => setTemplateData({...templateData, content: e.target.value})}
              placeholder="Enter template content..."
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can use variables like {`{{customer_name}}, {{company_name}}, etc.`}
            </p>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={updateTemplateMutation.isPending}
              className="bg-primary text-white"
            >
              {updateTemplateMutation.isPending ? 'Updating...' : 'Update Template'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};