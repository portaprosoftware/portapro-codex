import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIQuoteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMessageGenerated: (subject: string, content: string) => void;
  quoteData?: {
    customerName?: string;
    jobType?: string;
    totalAmount?: number;
    items?: any[];
    services?: any[];
  };
}

const MESSAGE_TYPES = [
  { value: 'quote_follow_up', label: 'Quote Follow-up' },
  { value: 'quote_explanation', label: 'Quote Explanation' },
  { value: 'pricing_justification', label: 'Pricing Justification' },
  { value: 'terms_conditions', label: 'Terms & Conditions' },
  { value: 'deadline_reminder', label: 'Deadline Reminder' },
  { value: 'service_benefits', label: 'Service Benefits' },
];

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'persuasive', label: 'Persuasive' },
  { value: 'informative', label: 'Informative' },
  { value: 'urgent', label: 'Urgent' },
];

export function AIQuoteMessageModal({ 
  isOpen, 
  onClose, 
  onMessageGenerated, 
  quoteData 
}: AIQuoteMessageModalProps) {
  const [messageType, setMessageType] = useState('');
  const [tone, setTone] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!customPrompt.trim()) {
      toast.error('Please enter some custom instructions to generate a quote message.');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Create enhanced prompt with quote context
      const quoteContext = quoteData ? `
Quote Context:
- Customer: ${quoteData.customerName || 'Valued Customer'}
- Service Type: ${quoteData.jobType || 'Service'}
- Total Amount: $${quoteData.totalAmount?.toFixed(2) || '0.00'}
- Items/Services: ${quoteData.items?.length || 0} items, ${quoteData.services?.length || 0} services
      ` : '';

      const enhancedPrompt = `${customPrompt}\n\n${quoteContext}`;

      const { data, error } = await supabase.functions.invoke('generate-customer-email', {
        body: {
          emailType: messageType,
          tone,
          customPrompt: enhancedPrompt
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to generate quote message');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const generatedSubject = data.subject || `${MESSAGE_TYPES.find(t => t.value === messageType)?.label} - Quote Update`;
      const generatedContent = data.content || 'Quote message could not be generated. Please try again.';
      
      onMessageGenerated(generatedSubject, generatedContent);
      toast.success('Quote message generated successfully!');
      onClose();
    } catch (error) {
      console.error('Error generating quote message:', error);
      toast.error(`Failed to generate quote message: ${error.message}`);
      
      // Fallback to basic template if AI fails
      const fallbackSubject = `${MESSAGE_TYPES.find(t => t.value === messageType)?.label} - Quote Update`;
      const fallbackContent = `Dear ${quoteData?.customerName || 'Valued Customer'},

Thank you for your interest in our services. We wanted to follow up on the quote we prepared for you.

${customPrompt ? `Regarding your inquiry: ${customPrompt}` : ''}

${quoteData?.totalAmount ? `Quote Total: $${quoteData.totalAmount.toFixed(2)}` : ''}

We appreciate your consideration and look forward to the opportunity to serve you.

Best regards,
The PortaPro Team`;

      onMessageGenerated(fallbackSubject, fallbackContent);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setMessageType('');
    setTone('');
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
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Quote Message Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Message Type Selection */}
          <div className="space-y-2">
            <Label>Message Type</Label>
            <Select value={messageType} onValueChange={setMessageType}>
              <SelectTrigger>
                <SelectValue placeholder="Select message type" />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_TYPES.map((type) => (
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

          {/* Quote Context Display */}
          {quoteData && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <Label className="text-sm font-medium">Quote Context</Label>
              <div className="text-sm text-muted-foreground mt-1 space-y-1">
                <p>Customer: {quoteData.customerName}</p>
                <p>Service: {quoteData.jobType}</p>
                {quoteData.totalAmount && <p>Total: ${quoteData.totalAmount.toFixed(2)}</p>}
              </div>
            </div>
          )}

          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label>Custom Instructions *</Label>
            <Textarea
              placeholder="What would you like to communicate about this quote? (e.g., 'Explain the benefits of our premium service package and why it's worth the investment.')"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!messageType || !tone || !customPrompt.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Message
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}