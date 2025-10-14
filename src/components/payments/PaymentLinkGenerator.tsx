import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Link2, Copy, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

interface PaymentLinkGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  customerId: string;
  jobId?: string;
  quoteId?: string;
  invoiceId?: string;
  paymentType?: 'deposit' | 'partial' | 'full';
  description?: string;
}

export const PaymentLinkGenerator: React.FC<PaymentLinkGeneratorProps> = ({
  open,
  onOpenChange,
  amount,
  customerId,
  jobId,
  quoteId,
  invoiceId,
  paymentType = 'deposit',
  description,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateLink = async () => {
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('stripe-payment-intent', {
        body: {
          action: 'create_payment_link',
          amount,
          customerId,
          jobId,
          quoteId,
          invoiceId,
          paymentType,
          description: description || `${paymentType} payment`,
        },
      });

      if (error) throw error;

      setPaymentLink(data.paymentLink);
      toast({
        title: 'Payment Link Generated',
        description: 'Share this link with your customer.',
      });

    } catch (error: any) {
      console.error('Error generating payment link:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate payment link.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Payment link copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link.',
        variant: 'destructive',
      });
    }
  };

  const sendViaEmail = () => {
    window.location.href = `mailto:?subject=Payment Link&body=Please use this link to complete your payment: ${paymentLink}`;
  };

  const sendViaSMS = () => {
    window.location.href = `sms:?body=Please use this link to complete your payment: ${paymentLink}`;
  };

  React.useEffect(() => {
    if (open && !paymentLink) {
      generateLink();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Payment Link
          </DialogTitle>
          <DialogDescription>
            Share this payment link with your customer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount Summary */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Amount:</span>
              <span className="font-bold text-lg">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Payment Type:</span>
              <span className="capitalize">{paymentType}</span>
            </div>
          </div>

          {/* Loading State */}
          {isGenerating && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Generating payment link...</AlertDescription>
            </Alert>
          )}

          {/* Payment Link */}
          {paymentLink && (
            <>
              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <QRCodeSVG value={paymentLink} size={200} />
              </div>

              {/* Link Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Link</label>
                <div className="flex gap-2">
                  <Input
                    value={paymentLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Share Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={sendViaEmail}
                  className="flex-1"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  onClick={sendViaSMS}
                  className="flex-1"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  SMS
                </Button>
              </div>

              <Alert>
                <AlertDescription className="text-xs">
                  This link will remain active until the payment is completed.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
