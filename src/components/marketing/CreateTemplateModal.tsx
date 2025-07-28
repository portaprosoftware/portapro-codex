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
import { Sparkles, Loader2 } from 'lucide-react';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
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

interface AIGenerationData {
  tone: 'professional' | 'friendly' | 'urgent' | 'casual';
  emailType: 'marketing' | 'reminder' | 'follow_up' | 'announcement' | 'custom';
  customInstructions: string;
}

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({ isOpen, onClose }) => {
  const [templateData, setTemplateData] = useState<TemplateData>({
    name: '',
    type: 'email',
    category: 'other',
    subject: '',
    content: '',
    emailContent: '',
    smsContent: ''
  });

  const [aiGenerationData, setAiGenerationData] = useState<AIGenerationData>({
    tone: 'professional',
    emailType: 'marketing',
    customInstructions: ''
  });

  const [showAISection, setShowAISection] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const queryClient = useQueryClient();

  const generateWithAIMutation = useMutation({
    mutationFn: async (params: { type: 'email' | 'sms' | 'both'; tone: string; emailType: string; customInstructions: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-campaign-content', {
        body: {
          type: params.type,
          tone: params.tone,
          emailType: params.emailType,
          customInstructions: params.customInstructions,
          includeSubject: params.type === 'email' || params.type === 'both'
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (templateData.type === 'both') {
        setTemplateData(prev => ({
          ...prev,
          subject: data.email?.subject || '',
          emailContent: data.email?.content || '',
          smsContent: data.sms?.content || '',
          content: data.email?.content || ''
        }));
      } else if (templateData.type === 'email') {
        setTemplateData(prev => ({
          ...prev,
          subject: data.subject || '',
          content: data.content || '',
          emailContent: data.content || ''
        }));
      } else {
        setTemplateData(prev => ({
          ...prev,
          content: data.content || '',
          smsContent: data.content || ''
        }));
      }
      toast({ title: 'AI content generated successfully!' });
    },
    onError: (error) => {
      console.error('Error generating AI content:', error);
      toast({ title: 'Error generating AI content', variant: 'destructive' });
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateData) => {
      const insertData: any = {
        name: data.name,
        type: data.type,
        category: data.category,
        source: 'custom',
        is_system: false,
        is_active: true
      };

      // Handle dual content for 'both' type
      if (data.type === 'both') {
        insertData.subject = data.subject;
        insertData.content = data.emailContent; // Keep existing content field for backwards compatibility
        insertData.email_content = data.emailContent;
        insertData.sms_content = data.smsContent;
      } else if (data.type === 'email') {
        insertData.subject = data.subject;
        insertData.content = data.content;
        insertData.email_content = data.content;
      } else {
        insertData.content = data.content;
        insertData.sms_content = data.content;
      }

      const { error } = await supabase
        .from('communication_templates')
        .insert(insertData);
      
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

  const handleAIGenerate = () => {
    if (!templateData.name) {
      toast({ title: 'Please enter a template name first', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    generateWithAIMutation.mutate({
      type: templateData.type,
      tone: aiGenerationData.tone,
      emailType: aiGenerationData.emailType,
      customInstructions: aiGenerationData.customInstructions
    });
    setIsGenerating(false);
  };

  const resetForm = () => {
    setTemplateData({
      name: '',
      type: 'email',
      category: 'other',
      subject: '',
      content: '',
      emailContent: '',
      smsContent: ''
    });
    setAiGenerationData({
      tone: 'professional',
      emailType: 'marketing',
      customInstructions: ''
    });
    setShowAISection(false);
  };

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
                onValueChange={(value: 'email' | 'sms' | 'both') => setTemplateData({...templateData, type: value})}
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

          {(templateData.type === 'email' || templateData.type === 'both') && (
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

          {/* AI Generation Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">AI Content Generation</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAISection(!showAISection)}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                {showAISection ? 'Hide AI' : 'Use AI'}
              </Button>
            </div>

            {showAISection && (
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="ai-tone">Tone</Label>
                    <Select 
                      value={aiGenerationData.tone} 
                      onValueChange={(value) => setAiGenerationData({...aiGenerationData, tone: value as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ai-email-type">Content Type</Label>
                    <Select 
                      value={aiGenerationData.emailType} 
                      onValueChange={(value) => setAiGenerationData({...aiGenerationData, emailType: value as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="ai-instructions">Custom Instructions</Label>
                  <Textarea
                    id="ai-instructions"
                    value={aiGenerationData.customInstructions}
                    onChange={(e) => setAiGenerationData({...aiGenerationData, customInstructions: e.target.value})}
                    placeholder="Describe what you want the content to be about..."
                    rows={2}
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={isGenerating || generateWithAIMutation.isPending}
                  className="w-full"
                >
                  {(isGenerating || generateWithAIMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate Content with AI
                </Button>
              </div>
            )}
          </div>

          {/* Content Sections */}
          {templateData.type === 'both' ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-email-content">Email Content *</Label>
                <Textarea
                  id="template-email-content"
                  value={templateData.emailContent}
                  onChange={(e) => setTemplateData({...templateData, emailContent: e.target.value})}
                  placeholder="Enter email content..."
                  rows={6}
                  className="resize-none"
                />
              </div>
              
              <div>
                <Label htmlFor="template-sms-content">SMS Content *</Label>
                <Textarea
                  id="template-sms-content"
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
              <Label htmlFor="template-content">Content *</Label>
              <Textarea
                id="template-content"
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