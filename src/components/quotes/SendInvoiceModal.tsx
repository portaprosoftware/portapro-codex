import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Mail, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

export function SendInvoiceModal({ isOpen, onClose, invoice }: SendInvoiceModalProps) {
  const [emailContent, setEmailContent] = useState('');
  const [smsContent, setSmsContent] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSendEmail = async () => {
    if (!emailContent.trim()) {
      toast.error('Please enter email content');
      return;
    }

    setIsLoading(true);
    try {
      // Here you would integrate with your email service
      // For now, we'll just simulate sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Invoice sent via email successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSMS = async () => {
    if (!smsContent.trim()) {
      toast.error('Please enter SMS content');
      return;
    }

    setIsLoading(true);
    try {
      // Here you would integrate with your SMS service
      // For now, we'll just simulate sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Invoice sent via SMS successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to send SMS');
    } finally {
      setIsLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            Send Invoice {invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={customEmail || invoice.customers?.email || ''}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-content">Email Content</Label>
              <Textarea
                id="email-content"
                rows={6}
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder={`Dear ${invoice.customers?.name || 'Customer'},

Please find attached your invoice ${invoice.invoice_number} for services rendered.

Invoice Details:
- Amount: $${invoice.amount}
- Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

Thank you for your business!

Best regards,
Your Company`}
              />
            </div>

            <Button 
              onClick={handleSendEmail}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
            >
              <Mail className="h-4 w-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send Email'}
            </Button>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sms-content">SMS Content</Label>
              <Textarea
                id="sms-content"
                rows={4}
                value={smsContent}
                onChange={(e) => setSmsContent(e.target.value)}
                placeholder={`Hi ${invoice.customers?.name || 'Customer'}, your invoice ${invoice.invoice_number} for $${invoice.amount} is ready. Due: ${new Date(invoice.due_date).toLocaleDateString()}. View: [link]`}
                maxLength={160}
              />
              <div className="text-sm text-muted-foreground text-right">
                {smsContent.length}/160 characters
              </div>
            </div>

            <Button 
              onClick={handleSendSMS}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send SMS'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}