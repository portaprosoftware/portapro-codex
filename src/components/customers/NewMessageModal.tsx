
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare, Send } from 'lucide-react';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
}

export function NewMessageModal({ isOpen, onClose, customerId }: NewMessageModalProps) {
  const [messageType, setMessageType] = useState('email');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [smsContent, setSmsContent] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');

  const handleSendEmail = () => {
    // TODO: Implement email sending
    console.log('Sending email:', { emailSubject, emailContent, emailAddress, customerId });
    onClose();
  };

  const handleSendSMS = () => {
    // TODO: Implement SMS sending
    console.log('Sending SMS:', { smsContent, phoneNumber, customerId });
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
                disabled={!emailAddress || !emailSubject || !emailContent}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" onClick={handleClose}>
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
