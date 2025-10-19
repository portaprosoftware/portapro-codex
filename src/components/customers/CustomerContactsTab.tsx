
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filter contacts based on search query
  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
    const email = contact.email?.toLowerCase() || '';
    const phone = contact.phone?.toLowerCase() || '';
    const title = contact.title?.toLowerCase() || '';
    const type = contact.contact_type?.toLowerCase() || '';
    
    return fullName.includes(query) || 
           email.includes(query) || 
           phone.includes(query) || 
           title.includes(query) ||
           type.includes(query);
  });

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header - Stacked on mobile, side-by-side on tablet+ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Customer Contacts</h3>
          <span className="text-sm text-muted-foreground">({contacts.length})</span>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold text-base"
        >
          <Plus className="w-5 h-5" />
          Add Contact
        </Button>
      </div>

      {/* Search Input */}
      {contacts.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 text-base"
          />
        </div>
      )}

      {/* Empty State */}
      {contacts.length === 0 ? (
        <div className="bg-card rounded-xl border-2 border-dashed border-border text-center py-12 px-4">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-semibold mb-2">No contacts added yet</p>
          <p className="text-sm text-muted-foreground mb-6">Add your first contact to get started</p>
          <Button 
            onClick={() => setShowAddModal(true)} 
            className="w-full md:w-auto h-11 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add First Contact
          </Button>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="bg-card rounded-xl border border-border text-center py-12 px-4">
          <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-semibold mb-2">No contacts found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search</p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4 max-w-4xl mx-auto">
          {filteredContacts.map((contact) => (
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
