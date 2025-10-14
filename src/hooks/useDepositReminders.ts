import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DepositReminder {
  customerEmail: string;
  customerName: string;
  amount: number;
  type: 'request' | 'reminder';
  dueDate?: string;
  quoteNumber?: string;
  invoiceNumber?: string;
  paymentLink?: string;
}

export function useDepositReminders() {
  const sendReminderMutation = useMutation({
    mutationFn: async (reminder: DepositReminder) => {
      const { error } = await supabase.functions.invoke('send-deposit-notification', {
        body: {
          to: reminder.customerEmail,
          customerName: reminder.customerName,
          amount: reminder.amount,
          type: reminder.type,
          dueDate: reminder.dueDate,
          quoteNumber: reminder.quoteNumber,
          invoiceNumber: reminder.invoiceNumber,
          paymentLink: reminder.paymentLink,
        },
      });

      if (error) throw error;
      return reminder;
    },
    onSuccess: (reminder) => {
      toast.success(`Reminder sent to ${reminder.customerName}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to send reminder: ${error.message}`);
    },
  });

  return {
    sendReminder: sendReminderMutation.mutate,
    isSending: sendReminderMutation.isPending,
  };
}
