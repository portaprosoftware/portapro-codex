
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, Send, Sparkles } from 'lucide-react';

interface AIEmailGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
}

const EMAIL_TYPES = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'thank_you', label: 'Thank You' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'service_update', label: 'Service Update' },
];

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'casual', label: 'Casual' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'appreciative', label: 'Appreciative' },
];

export function AIEmailGeneratorModal({ isOpen, onClose, customerId }: AIEmailGeneratorModalProps) {
  const [emailType, setEmailType] = useState('');
  const [tone, setTone] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation - you would replace this with actual AI API call
    setTimeout(() => {
      const generatedSubject = `${EMAIL_TYPES.find(t => t.value === emailType)?.label} - Important Update`;
      const generatedContent = `Dear Valued Customer,

We hope this message finds you well. We wanted to reach out regarding your recent service with us.

${customPrompt ? `Based on your request: ${customPrompt}` : ''}

We appreciate your continued business and look forward to serving you again.

Best regards,
The Team`;

      setSubject(generatedSubject);
      setContent(generatedContent);
      setIsGenerating(false);
    }, 2000);
  };

  const handleSend = () => {
    // TODO: Implement email sending
    console.log('Sending email:', { emailType, tone, subject, content, customerId });
    onClose();
  };

  const resetForm = () => {
    setEmailType('');
    setTone('');
    setSubject('');
    setContent('');
    setCustomPrompt('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-600" />
            AI Email Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Type Selection */}
          <div className="space-y-2">
            <Label>Email Type</Label>
            <Select value={emailType} onValueChange={setEmailType}>
              <SelectTrigger>
                <SelectValue placeholder="Select email type" />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tone Selection */}
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label>Custom Instructions (Optional)</Label>
            <Textarea
              placeholder="Add any specific details or instructions for the AI..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!emailType || !tone || isGenerating}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 mr-2" />
                Generate Email
              </>
            )}
          </Button>

          {/* Generated Content */}
          {(subject || content) && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>

              <div className="space-y-2">
                <Label>Email Content</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  placeholder="Email content will appear here..."
                />
              </div>

              {/* Send Actions */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={handleSend}
                  disabled={!subject || !content}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
