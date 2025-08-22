import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedInvoiceWizard } from '@/components/invoices/EnhancedInvoiceWizard';
import { Mail, MessageSquare, FileText, Calendar, MapPin, Clock, Receipt, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { AIQuoteMessageModal } from '@/components/quotes/AIQuoteMessageModal';

interface QuotePreviewStepProps {
  onSendQuote: (sendOptions: QuoteSendOptions) => void;
  onSaveDraft: () => void;
  sending?: boolean;
}

export interface QuoteSendOptions {
  method: 'email' | 'sms' | 'email_sms';
  recipientEmail?: string;
  recipientPhone?: string;
  subject?: string;
  message?: string;
  sendImmediately: boolean;
}

export const QuotePreviewStep: React.FC<QuotePreviewStepProps> = ({
  onSendQuote,
  onSaveDraft,
  sending = false
}) => {
  const { state } = useJobWizard();
  const [sendMethod, setSendMethod] = useState<'email' | 'sms' | 'email_sms'>('email');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [subject, setSubject] = useState('Your Quote from PortaPro');
  const [message, setMessage] = useState('Please find your quote attached. We look forward to working with you!');
  const [sendImmediately, setSendImmediately] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);

  // Fetch customer data
  const { data: customer } = useQuery({
    queryKey: ['customer', state.data.customer_id],
    queryFn: async () => {
      if (!state.data.customer_id) return null;
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', state.data.customer_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!state.data.customer_id
  });

  React.useEffect(() => {
    if (customer?.email && !recipientEmail) {
      setRecipientEmail(customer.email);
    }
    if (customer?.phone && !recipientPhone) {
      setRecipientPhone(customer.phone);
    }
  }, [customer]);

  const getJobTypeBadgeClass = (jobType: string) => {
    const type = jobType?.toLowerCase();
    switch (type) {
      case 'delivery':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0';
      case 'estimate':
      case 'on-site':
      case 'estimate/on-site':
        return 'bg-gradient-to-r from-red-800 to-red-900 text-white font-bold border-0';
      case 'pickup':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold border-0';
      case 'service':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold border-0';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0';
    }
  };

  const calculateSubtotal = () => {
    let subtotal = 0;
    
    // Add items cost
    if (state.data.items) {
      state.data.items.forEach(item => {
        // This would need actual pricing logic
        subtotal += item.quantity * 100; // Placeholder
      });
    }
    
    // Add services cost
    if (state.data.servicesData?.selectedServices) {
      subtotal += state.data.servicesData.servicesSubtotal || 0;
    }
    
    return subtotal;
  };

  const subtotal = calculateSubtotal();
  const taxRate = 0.08; // 8% tax
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const handleSend = () => {
    const sendOptions: QuoteSendOptions = {
      method: sendMethod,
      recipientEmail: sendMethod === 'email' ? recipientEmail : undefined,
      recipientPhone: sendMethod === 'sms' ? recipientPhone : undefined,
      subject: sendMethod === 'email' ? subject : undefined,
      message,
      sendImmediately
    };
    
    onSendQuote(sendOptions);
  };

  const handleAIMessageGenerated = (generatedSubject: string, generatedContent: string) => {
    if (sendMethod === 'email' || sendMethod === 'email_sms') {
      setSubject(generatedSubject);
    }
    setMessage(generatedContent);
  };

  // Prepare quote data for AI context
  const quoteData = {
    customerName: customer?.name,
    jobType: state.data.job_type,
    totalAmount: total,
    items: state.data.items || [],
    services: state.data.servicesData?.selectedServices || []
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quote Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quote Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Info */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Customer</Label>
              <p className="font-medium">{customer?.name}</p>
              <p className="text-sm text-muted-foreground">{customer?.email}</p>
              <p className="text-sm text-muted-foreground">{customer?.phone}</p>
            </div>

            <Separator />

            {/* Job Details */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Service Details</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {state.data.scheduled_date ? format(new Date(state.data.scheduled_date), 'PPP') : 'No date set'}
                </span>
              </div>
              {state.data.scheduled_time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{state.data.scheduled_time}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getJobTypeBadgeClass(state.data.job_type)}>
                  {state.data.job_type?.charAt(0).toUpperCase() + state.data.job_type?.slice(1).toLowerCase()}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Items & Services</Label>
              
              {/* Items */}
              {state.data.items && state.data.items.length > 0 && (
                <div className="space-y-1">
                  {state.data.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>Item {index + 1} (Qty: {item.quantity})</span>
                      <span>${(item.quantity * 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Services */}
              {state.data.servicesData?.selectedServices && state.data.servicesData.selectedServices.length > 0 && (
                <div className="space-y-1">
                  {state.data.servicesData.selectedServices.map((service, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{service.name || `Service ${index + 1}`}</span>
                      <span>${(service.calculated_cost || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Pricing Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (8%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Send Options */}
        <Card>
          <CardHeader>
            <CardTitle>Send Quote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-medium">Delivery Method</Label>
              <RadioGroup value={sendMethod} onValueChange={(value: any) => setSendMethod(value)} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sms" id="sms" />
                  <Label htmlFor="sms" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    SMS
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email_sms" id="email_sms" />
                  <Label htmlFor="email_sms" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <MessageSquare className="h-4 w-4" />
                    Email & Text
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {sendMethod === 'email' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="email-recipient">Recipient Email</Label>
                  <Input
                    id="email-recipient"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-message">Message</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowAIModal(true)}
                      className="h-8 px-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Create with AI
                    </Button>
                  </div>
                  <Textarea
                    id="email-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {sendMethod === 'sms' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="sms-recipient">Recipient Phone</Label>
                  <Input
                    id="sms-recipient"
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms-message">Message</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowAIModal(true)}
                      className="h-8 px-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Create with AI
                    </Button>
                  </div>
                  <Textarea
                    id="sms-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.length}/160 characters
                  </p>
                </div>
              </div>
            )}

            {/* Email & SMS combined method */}
            {sendMethod === 'email_sms' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="email-recipient">Recipient Email</Label>
                  <Input
                    id="email-recipient"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="sms-recipient">Recipient Phone</Label>
                  <Input
                    id="sms-recipient"
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-message">Message</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowAIModal(true)}
                      className="h-8 px-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Create with AI
                    </Button>
                  </div>
                  <Textarea
                    id="email-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <div className="pt-4 space-y-3">
              <Button 
                onClick={handleSend} 
                className="w-full"
                disabled={sending || (!recipientEmail && (sendMethod === 'email' || sendMethod === 'email_sms')) || (!recipientPhone && (sendMethod === 'sms' || sendMethod === 'email_sms'))}
              >
                {sending ? 'Sending...' : sendMethod === 'email_sms' ? 'Send Quote via Email & SMS' : `Send Quote via ${sendMethod === 'email' ? 'Email' : 'SMS'}`}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onSaveDraft}
                className="w-full"
                disabled={sending}
              >
                Save as Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Quote Message Modal */}
      <AIQuoteMessageModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onMessageGenerated={handleAIMessageGenerated}
        quoteData={quoteData}
      />
    </div>
  );
};