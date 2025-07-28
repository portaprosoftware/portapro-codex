
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CustomerContactCard } from './CustomerContactCard';
import { AddContactModal } from './AddContactModal';
import { toast } from '@/hooks/use-toast';

interface CustomerContactsTabProps {
  customerId: string;
}

interface CustomerContact {
  id: string;
  customer_id: string;
  contact_type: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  title?: string;
  notes?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export function CustomerContactsTab({ customerId }: CustomerContactsTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['customer-contacts', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_contacts')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as CustomerContact[];
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('customer_contacts')
        .delete()
        .eq('id', contactId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-contacts', customerId] });
      toast({
        title: "Contact deleted",
        description: "The contact has been successfully removed.",
      });
    },
    onError: (error) => {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete the contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteContact = (contactId: string) => {
    deleteContactMutation.mutate(contactId);
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Customer Contacts</h3>
          <span className="text-sm text-muted-foreground">({contacts.length})</span>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No contacts added yet</p>
          <p className="text-sm mb-4">Add your first contact to get started</p>
          <Button onClick={() => setShowAddModal(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add First Contact
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {contacts.map((contact) => (
            <CustomerContactCard
              key={contact.id}
              contact={contact}
              onDelete={handleDeleteContact}
              customerId={customerId}
            />
          ))}
        </div>
      )}

      <AddContactModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        customerId={customerId}
      />
    </div>
  );
}
