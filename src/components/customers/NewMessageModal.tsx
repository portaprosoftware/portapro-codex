
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationId } from '@/hooks/useOrganizationId';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
}

export function NewMessageModal({ isOpen, onClose, customerId }: NewMessageModalProps) {
  const queryClient = useQueryClient();
  const { orgId } = useOrganizationId();
  const [messageType, setMessageType] = useState('email');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [smsContent, setSmsContent] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('Organization ID required');
      
      const { data, error } = await supabase.functions.invoke('send-customer-email', {
        body: {
          customerId,
          subject: emailSubject,
          content: emailContent,
          emailAddress: emailAddress || undefined,
          organizationId: orgId,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-communications', customerId] });
      toast.success('Email sent successfully!');
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      console.error('Failed to send email:', error);
      toast.error(`Failed to send email: ${error.message}`);
    },
  });

  const handleSendEmail = () => {
    if (!emailSubject || !emailContent) {
      toast.error('Please fill in all required fields');
      return;
    }
    sendEmailMutation.mutate();
  };

  const handleSendSMS = () => {
    // TODO: Implement SMS sending
    console.log('Sending SMS:', { smsContent, phoneNumber, customerId });
    toast.info('SMS sending coming soon!');
    onClose();
  };

  const resetForm = () => {
    setEmailSubject('');
    setEmailContent('');
    setSmsContent('');
    setPhoneNumber('');
    setEmailAddress('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <Tabs value={messageType} onValueChange={setMessageType} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              SMS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your email message here..."
                rows={8}
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                onClick={handleSendEmail}
                disabled={!emailSubject || !emailContent || sendEmailMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={sendEmailMutation.isPending}>
                Cancel
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your SMS message here..."
                rows={6}
                value={smsContent}
                onChange={(e) => setSmsContent(e.target.value)}
                maxLength={160}
              />
              <div className="text-sm text-muted-foreground text-right">
                {smsContent.length}/160 characters
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                onClick={handleSendSMS}
                disabled={!phoneNumber || !smsContent}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Send SMS
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
