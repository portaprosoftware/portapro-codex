import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerFooter,
  DrawerClose 
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface DeleteCustomerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    name: string;
  };
}

export function DeleteCustomerDrawer({ isOpen, onClose, customer }: DeleteCustomerDrawerProps) {
  const [confirmText, setConfirmText] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const deleteCustomerMutation = useMutation({
    mutationFn: async () => {
      // Perform cascading deletion of all related records
      
      // Delete customer contacts first
      const { error: contactsError } = await supabase
        .from('customer_contacts')
        .delete()
        .eq('customer_id', customer.id);
      
      if (contactsError) {
        console.error('Error deleting customer contacts:', contactsError);
        throw new Error('Failed to delete customer contacts');
      }

      // Delete customer service locations
      const { error: locationsError } = await supabase
        .from('customer_service_locations')
        .delete()
        .eq('customer_id', customer.id);
      
      if (locationsError) {
        console.error('Error deleting customer service locations:', locationsError);
        throw new Error('Failed to delete customer service locations');
      }

      // Delete customer communications
      const { error: communicationsError } = await supabase
        .from('customer_communications')
        .delete()
        .eq('customer_id', customer.id);
      
      if (communicationsError) {
        console.error('Error deleting customer communications:', communicationsError);
        throw new Error('Failed to delete customer communications');
      }

      // Delete quotes associated with this customer
      const { error: quotesError } = await supabase
        .from('quotes')
        .delete()
        .eq('customer_id', customer.id);
      
      if (quotesError) {
        console.error('Error deleting quotes:', quotesError);
        throw new Error('Failed to delete customer quotes');
      }

      // Delete invoices associated with this customer
      const { error: invoicesError } = await supabase
        .from('invoices')
        .delete()
        .eq('customer_id', customer.id);
      
      if (invoicesError) {
        console.error('Error deleting invoices:', invoicesError);
        throw new Error('Failed to delete customer invoices');
      }

      // Delete jobs associated with this customer
      const { error: jobsError } = await supabase
        .from('jobs')
        .delete()
        .eq('customer_id', customer.id);
      
      if (jobsError) {
        console.error('Error deleting jobs:', jobsError);
        throw new Error('Failed to delete customer jobs');
      }

      // Finally, delete the customer record
      const { error: customerError } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id);

      if (customerError) {
        console.error('Error deleting customer:', customerError);
        throw new Error('Failed to delete customer');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: 'Customer Deleted',
        description: 'Customer has been permanently deleted.',
        variant: 'destructive',
      });
      onClose();
      // Navigate back to customers list
      navigate('/customers');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete customer. They may have associated data.',
        variant: 'destructive',
      });
      console.error('Error deleting customer:', error);
    },
  });

  const handleDelete = () => {
    if (confirmText.toLowerCase() === 'delete') {
      deleteCustomerMutation.mutate();
      setConfirmText('');
    } else {
      toast({
        title: 'Confirmation Failed',
        description: 'Please type "delete" exactly to confirm',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleClose}>
      <DrawerContent className="h-[90vh] max-h-[90vh]">
        <DrawerHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
          <DrawerTitle className="text-red-600 text-xl font-bold">
            Delete Customer Profile
          </DrawerTitle>
          <DrawerDescription className="text-center">
            This action cannot be undone. This will permanently delete{' '}
            <span className="font-semibold">{customer.name}</span> and all associated data.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 py-4 flex-1">
          <div className="space-y-4">
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-gray-600" />
                <div>
                  <h4 className="font-semibold text-black">Warning</h4>
                  <p className="text-sm text-gray-600">
                    This will delete all jobs, quotes, invoices, and related data.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Type "delete" to confirm:
              </label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete"
                className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
              />
            </div>
          </div>
        </div>

        <DrawerFooter>
          <div className="flex gap-3 w-full">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </DrawerClose>
            <Button 
              onClick={handleDelete}
              disabled={deleteCustomerMutation.isPending || confirmText.toLowerCase() !== 'delete'}
              variant="destructive"
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {deleteCustomerMutation.isPending ? (
                "Deleting..."
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Customer
                </>
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}