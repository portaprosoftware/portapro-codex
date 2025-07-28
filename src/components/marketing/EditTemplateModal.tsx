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
  type: 'email' | 'sms' | 'both';
  subject?: string;
  content: string;
  email_content?: string;
  sms_content?: string;
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
  type: 'email' | 'sms' | 'both';
  category: string;
  subject: string;
  content: string;
  emailContent: string;
  smsContent: string;
}

export const EditTemplateModal: React.FC<EditTemplateModalProps> = ({ isOpen, onClose, template }) => {
  const [templateData, setTemplateData] = useState<TemplateData>({
    name: '',
    type: 'email',
    category: 'other',
    subject: '',
    content: '',
    emailContent: '',
    smsContent: ''
  });

  const queryClient = useQueryClient();

  // Populate form when template changes
  useEffect(() => {
    if (template) {
      setTemplateData({
        name: template.name,
        type: template.type as 'email' | 'sms' | 'both',
        category: template.category || 'other',
        subject: template.subject || '',
        content: template.content,
        emailContent: template.email_content || template.content || '',
        smsContent: template.sms_content || (template.type === 'sms' ? template.content : '') || ''
      });
    }
  }, [template]);

  const updateTemplateMutation = useMutation({
    mutationFn: async (data: TemplateData) => {
      if (!template) throw new Error('No template to update');
      
      const updateData: any = {
        name: data.name,
        type: data.type,
        category: data.category
      };

      // Handle dual content for 'both' type
      if (data.type === 'both') {
        updateData.subject = data.subject;
        updateData.content = data.emailContent; // Keep existing content field for backwards compatibility
        updateData.email_content = data.emailContent;
        updateData.sms_content = data.smsContent;
      } else if (data.type === 'email') {
        updateData.subject = data.subject;
        updateData.content = data.content;
        updateData.email_content = data.content;
        updateData.sms_content = null;
      } else {
        updateData.subject = null;
        updateData.content = data.content;
        updateData.email_content = null;
        updateData.sms_content = data.content;
      }
      
      const { error } = await supabase
        .from('communication_templates')
        .update(updateData)
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
    if (!templateData.name) {
      toast({ title: 'Please fill in template name', variant: 'destructive' });
      return;
    }

    if (templateData.type === 'both') {
      if (!templateData.subject || !templateData.emailContent || !templateData.smsContent) {
        toast({ title: 'Both email and SMS content are required for "both" type templates', variant: 'destructive' });
        return;
      }
    } else if (templateData.type === 'email') {
      if (!templateData.subject || !templateData.content) {
        toast({ title: 'Email templates require a subject and content', variant: 'destructive' });
        return;
      }
    } else if (templateData.type === 'sms') {
      if (!templateData.content) {
        toast({ title: 'SMS templates require content', variant: 'destructive' });
        return;
      }
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
                onValueChange={(value: 'email' | 'sms' | 'both') => setTemplateData({...templateData, type: value})}
                disabled={template?.source === 'system'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="both">Both (Email + SMS)</SelectItem>
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

          {(templateData.type === 'email' || templateData.type === 'both') && (
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

          {/* Content Sections */}
          {templateData.type === 'both' ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-template-email-content">Email Content *</Label>
                <Textarea
                  id="edit-template-email-content"
                  value={templateData.emailContent}
                  onChange={(e) => setTemplateData({...templateData, emailContent: e.target.value})}
                  placeholder="Enter email content..."
                  rows={6}
                  className="resize-none"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-template-sms-content">SMS Content *</Label>
                <Textarea
                  id="edit-template-sms-content"
                  value={templateData.smsContent}
                  onChange={(e) => setTemplateData({...templateData, smsContent: e.target.value})}
                  placeholder="Enter SMS content..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  SMS: {templateData.smsContent.length}/160 characters
                </p>
              </div>
            </div>
          ) : (
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
              {templateData.type === 'sms' && (
                <p className="text-xs text-gray-500 mt-1">
                  SMS: {templateData.content.length}/160 characters
                </p>
              )}
            </div>
          )}
          
          <p className="text-xs text-gray-500">
            You can use variables like {`{{customer_name}}, {{company_name}}, etc.`}
          </p>

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