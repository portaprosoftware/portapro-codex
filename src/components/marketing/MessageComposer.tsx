import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Bot, Trash2, Eye, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ButtonBuilder } from './ButtonBuilder';
import { SavedButtons } from './SavedButtons';

interface CustomButton {
  id: string;
  text: string;
  type: 'url' | 'phone' | 'email';
  value: string;
  style: 'primary' | 'secondary';
  includeEmoji?: boolean;
}

interface MessageData {
  subject?: string;
  content: string;
  buttons: CustomButton[];
}

interface MessageComposerProps {
  campaignType: 'email' | 'sms' | 'both';
  onSave: (messageData: MessageData) => void;
  onBack: () => void;
  initialData?: MessageData;
}

const EMAIL_TYPES = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'custom', label: 'Custom' },
];

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'casual', label: 'Casual' },
];

export const MessageComposer: React.FC<MessageComposerProps> = ({
  campaignType,
  onSave,
  onBack,
  initialData
}) => {
  const [messageData, setMessageData] = useState<MessageData>(
    initialData || {
      subject: '',
      content: '',
      buttons: []
    }
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [aiParams, setAiParams] = useState({
    emailType: '',
    tone: '',
    customInstructions: ''
  });

  const handleAIGenerate = async () => {
    if (!aiParams.tone) {
      toast({ title: 'Please select a tone', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-campaign-content', {
        body: {
          type: campaignType === 'both' ? 'email' : campaignType,
          emailType: aiParams.emailType || undefined,
          tone: aiParams.tone,
          customInstructions: aiParams.customInstructions || undefined,
          includeSubject: campaignType !== 'sms'
        }
      });

      if (error) throw error;

      setMessageData(prev => ({
        ...prev,
        subject: data.subject || prev.subject,
        content: data.content
      }));

      toast({ title: 'Content generated successfully!' });
    } catch (error) {
      console.error('AI generation error:', error);
      toast({ 
        title: 'Failed to generate content', 
        description: 'Please try again or create manually',
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addButton = (button: CustomButton) => {
    setMessageData(prev => ({
      ...prev,
      buttons: [...prev.buttons, button]
    }));
  };

  const updateButton = (id: string, updates: Partial<CustomButton>) => {
    setMessageData(prev => ({
      ...prev,
      buttons: prev.buttons.map(btn => 
        btn.id === id ? { ...btn, ...updates } : btn
      )
    }));
  };

  const removeButton = (id: string) => {
    setMessageData(prev => ({
      ...prev,
      buttons: prev.buttons.filter(btn => btn.id !== id)
    }));
  };

  const handleSave = () => {
    if (!messageData.content.trim()) {
      toast({ title: 'Please add message content', variant: 'destructive' });
      return;
    }

    if (campaignType !== 'sms' && !messageData.subject?.trim()) {
      toast({ title: 'Please add a subject line', variant: 'destructive' });
      return;
    }

    onSave(messageData);
  };

  const getButtonIcon = (type: string, includeEmoji = true) => {
    if (!includeEmoji) return '';
    switch (type) {
      case 'phone': return '📞';
      case 'email': return '✉️';
      case 'url': return '🔗';
      default: return '🔗';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h2 className="text-xl font-semibold font-inter">Create Your Message</h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Message Composer */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 font-inter">AI Assistant</h3>
            
            <div className="space-y-4">
              {campaignType !== 'sms' && (
                <div>
                  <Label>Email Type</Label>
                  <Select value={aiParams.emailType} onValueChange={(value) => setAiParams(prev => ({ ...prev, emailType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select email type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Tone</Label>
                <Select value={aiParams.tone} onValueChange={(value) => setAiParams(prev => ({ ...prev, tone: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map(tone => (
                      <SelectItem key={tone.value} value={tone.value}>
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Custom Instructions (Optional)</Label>
                <Textarea
                  placeholder="Add specific details or requirements..."
                  value={aiParams.customInstructions}
                  onChange={(e) => setAiParams(prev => ({ ...prev, customInstructions: e.target.value }))}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleAIGenerate}
                disabled={!aiParams.tone || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Bot className="w-4 h-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 font-inter">Message Content</h3>
            
            <div className="space-y-4">
              {campaignType !== 'sms' && (
                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={messageData.subject}
                    onChange={(e) => setMessageData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter email subject"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="content">Message Content</Label>
                <Textarea
                  id="content"
                  value={messageData.content}
                  onChange={(e) => setMessageData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={campaignType === 'sms' ? 'Enter SMS message (keep it concise)' : 'Enter email content'}
                  rows={campaignType === 'sms' ? 4 : 8}
                />
                {campaignType === 'sms' && (
                  <p className="text-sm text-gray-500 mt-1">
                    {messageData.content.length}/160 characters
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 font-inter">Action Buttons</h3>

            <div className="space-y-4">
              {/* Button Builder */}
              <ButtonBuilder onAddButton={addButton} />

              {/* Existing Buttons */}
              {messageData.buttons.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium font-inter">Added Buttons</h4>
                  {messageData.buttons.map((button) => (
                    <div key={button.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Button {messageData.buttons.indexOf(button) + 1}</span>
                        <Button
                          onClick={() => removeButton(button.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Button Text</Label>
                          <Input
                            value={button.text}
                            onChange={(e) => updateButton(button.id, { text: e.target.value })}
                            placeholder="e.g., Call Now"
                          />
                        </div>
                        <div>
                          <Label>Type</Label>
                          <Select value={button.type} onValueChange={(value: any) => updateButton(button.id, { type: value })}>
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
                        <Label>
                          {button.type === 'url' ? 'URL' : 
                           button.type === 'phone' ? 'Phone Number' : 'Email Address'}
                        </Label>
                        <Input
                          value={button.value}
                          onChange={(e) => updateButton(button.id, { value: e.target.value })}
                          placeholder={
                            button.type === 'url' ? 'https://example.com' :
                            button.type === 'phone' ? '(555) 123-4567' : 'contact@example.com'
                          }
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`emoji-${button.id}`}
                          checked={button.includeEmoji !== false}
                          onCheckedChange={(checked) => updateButton(button.id, { includeEmoji: !!checked })}
                        />
                        <Label htmlFor={`emoji-${button.id}`} className="text-sm">
                          Include emoji ({getButtonIcon(button.type)})
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-inter">Preview</h3>
              <Button onClick={() => setShowPreview(true)} variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Full Preview
              </Button>
            </div>

            <div className="space-y-4">
              {campaignType !== 'sms' && messageData.subject && (
                <div>
                  <Label className="text-sm text-gray-500">Subject</Label>
                  <p className="font-medium">{messageData.subject}</p>
                </div>
              )}

              {messageData.content && (
                <div>
                  <Label className="text-sm text-gray-500">Content</Label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="whitespace-pre-wrap text-sm">{messageData.content}</p>
                  </div>
                </div>
              )}

              {messageData.buttons.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-500">Action Buttons</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {messageData.buttons.map((button) => (
                      <Badge key={button.id} variant="secondary" className="flex items-center gap-1">
                        {button.includeEmoji !== false && <span>{getButtonIcon(button.type)}</span>}
                        {button.text || 'Untitled Button'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Saved Buttons */}
          <SavedButtons onSelectButton={addButton} />

          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              Use This Message
            </Button>
            <Button onClick={onBack} variant="outline">
              Back to Templates
            </Button>
          </div>
        </div>
      </div>

      {/* Full Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Preview</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {campaignType !== 'sms' && messageData.subject && (
              <div>
                <Label>Subject Line</Label>
                <p className="text-lg font-semibold">{messageData.subject}</p>
              </div>
            )}

            <div>
              <Label>Message Content</Label>
              <div className="p-4 border rounded-lg bg-white">
                <p className="whitespace-pre-wrap">{messageData.content}</p>
                
                {messageData.buttons.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                    {messageData.buttons.map((button) => (
                      <Button key={button.id} size="sm" variant={button.style === 'primary' ? 'default' : 'outline'}>
                        {button.includeEmoji !== false && getButtonIcon(button.type)} {button.text}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};