import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TemplateData {
  name: string;
  type: 'email' | 'sms';
  category: string;
  subject: string;
  content: string;
}

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({ isOpen, onClose }) => {
  const [templateData, setTemplateData] = useState<TemplateData>({
    name: '',
    type: 'email',
    category: 'other',
    subject: '',
    content: ''
  });

  const queryClient = useQueryClient();

  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateData) => {
      const { error } = await supabase
        .from('communication_templates')
        .insert({
          name: data.name,
          type: data.type,
          category: data.category,
          subject: data.type === 'email' ? data.subject : null,
          content: data.content,
          source: 'custom',
          is_system: false,
          is_active: true
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] });
      toast({ title: 'Template created successfully!' });
      resetForm();
      onClose();
    },
    onError: (error) => {
      console.error('Error creating template:', error);
      toast({ title: 'Error creating template', variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setTemplateData({
      name: '',
      type: 'email',
      category: 'other',
      subject: '',
      content: ''
    });
  };

  const handleSubmit = () => {
    if (!templateData.name || !templateData.content) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    if (templateData.type === 'email' && !templateData.subject) {
      toast({ title: 'Email templates require a subject', variant: 'destructive' });
      return;
    }

    createTemplateMutation.mutate(templateData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" aria-describedby="create-template-description">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
        </DialogHeader>
        
        <div id="create-template-description" className="sr-only">
          Create a new communication template for emails or SMS messages
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={templateData.name}
                onChange={(e) => setTemplateData({...templateData, name: e.target.value})}
                placeholder="Enter template name"
              />
            </div>
            
            <div>
              <Label htmlFor="template-type">Type *</Label>
              <Select 
                value={templateData.type} 
                onValueChange={(value: 'email' | 'sms') => setTemplateData({...templateData, type: value})}
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
            <Label htmlFor="template-category">Category</Label>
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
              <Label htmlFor="template-subject">Subject *</Label>
              <Input
                id="template-subject"
                value={templateData.subject}
                onChange={(e) => setTemplateData({...templateData, subject: e.target.value})}
                placeholder="Enter email subject"
              />
            </div>
          )}

          <div>
            <Label htmlFor="template-content">Content *</Label>
            <Textarea
              id="template-content"
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
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createTemplateMutation.isPending}
              className="bg-primary text-white"
            >
              {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};