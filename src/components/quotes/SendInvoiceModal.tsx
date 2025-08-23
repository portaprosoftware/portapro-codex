import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

export function SendInvoiceModal({ isOpen, onClose, invoice }: SendInvoiceModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSend = async (method: 'email' | 'sms' | 'both') => {
    if (!customerName.trim() || !customerEmail.trim()) {
      toast.error('Please fill in customer name and email');
      return;
    }

    if ((method === 'sms' || method === 'both') && !customerPhone.trim()) {
      toast.error('Please enter phone number for SMS');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: invoice.id,
          customerEmail: customerEmail,
          customerPhone: customerPhone,
          customerName: customerName,
          sendMethod: method
        }
      });

      if (error) throw error;
      
      toast.success(`Invoice sent successfully via ${method}`);
      onClose();
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(`Failed to send invoice via ${method}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize with invoice customer data
  React.useEffect(() => {
    if (invoice && isOpen) {
      setCustomerName(invoice.customers?.name || '');
      setCustomerEmail(invoice.customers?.email || '');
      setCustomerPhone(invoice.customers?.phone || '');
    }
  }, [invoice, isOpen]);

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Send Invoice {invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Customer Name</Label>
            <Input
              id="customer-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="border-blue-200 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-email">Email Address</Label>
            <Input
              id="customer-email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Enter email address"
              className="border-blue-200 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-phone">Phone Number</Label>
            <Input
              id="customer-phone"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone number"
              className="border-blue-200 focus:border-blue-500"
            />
          </div>

          <div className="pt-4">
            <h3 className="text-sm font-medium mb-3 text-center">
              How would you like to send the invoice?
            </h3>
            
            <div className="space-y-3">
              <Button 
                onClick={() => handleSend('email')}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
              >
                {isLoading ? 'Sending...' : 'Send via Email'}
              </Button>

              <Button 
                onClick={() => handleSend('sms')}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
              >
                {isLoading ? 'Sending...' : 'Send via SMS'}
              </Button>

              <Button 
                onClick={() => handleSend('both')}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
              >
                {isLoading ? 'Sending...' : 'Send via Email & SMS'}
              </Button>

              <Button 
                variant="outline"
                onClick={onClose}
                className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}