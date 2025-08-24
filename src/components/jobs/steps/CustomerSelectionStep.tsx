import React, { useState, useEffect } from 'react';
import { Search, Plus, Building2, User, Phone, Mail, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { formatCategoryDisplay } from '@/lib/categoryUtils';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  customer_type?: string;
  address?: string;
  notes?: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  contact_type: string;
  email?: string;
  phone?: string;
  title?: string;
  is_primary: boolean;
}

export function CustomerSelectionStep() {
  const { state, updateData } = useJobWizard();
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactSelection, setShowContactSelection] = useState(false);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('id, name, email, phone, customer_type, address, notes')
        .order('name');

      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data as Customer[];
    },
  });

  // Fetch contacts for selected customer
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['customer-contacts', state.data.customer_id],
    queryFn: async () => {
      if (!state.data.customer_id) return [];
      
      const { data, error } = await supabase
        .from('customer_contacts')
        .select('id, first_name, last_name, contact_type, email, phone, title, is_primary')
        .eq('customer_id', state.data.customer_id)
        .order('is_primary', { ascending: false })
        .order('first_name');
      
      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!state.data.customer_id,
  });

  const handleCustomerSelect = (customer: Customer) => {
    // Clear previous contact selection when switching customers
    updateData({
      customer_id: customer.id,
      contact_id: undefined,
    });
    
    // Don't automatically show contact selection - let useEffect handle it
    // setShowContactSelection(true); // Removed this line
  };

  const handleContactSelect = (contact: Contact) => {
    updateData({
      contact_id: contact.id,
    });
  };

  const handleSkipContactSelection = () => {
    updateData({
      contact_id: undefined,
    });
    setShowContactSelection(false);
  };

  const handleResetCustomer = () => {
    updateData({
      customer_id: undefined,
      contact_id: undefined,
    });
    setShowContactSelection(false);
  };

  // Auto-skip contact selection if no contacts exist, or show it if contacts do exist
  useEffect(() => {
    console.log('Contact selection effect:', {
      customer_id: state.data.customer_id,
      isLoadingContacts,
      contactsLength: contacts.length,
      contact_id: state.data.contact_id,
      showContactSelection
    });
    
    if (state.data.customer_id && !isLoadingContacts) {
      console.log('Customer selected and contacts loaded, contacts:', contacts);
      
      if (contacts.length === 0) {
        // No contacts exist - skip contact selection entirely
        console.log('No contacts found, skipping contact selection');
        setShowContactSelection(false);
      } else {
        // Contacts exist - show contact selection if not already selected
        console.log('Contacts found:', contacts.length, 'contact_id:', state.data.contact_id);
        if (!state.data.contact_id) {
          console.log('No contact selected yet, showing contact selection');
          setShowContactSelection(true);
        } else {
          console.log('Contact already selected, hiding contact selection');
          setShowContactSelection(false);
        }
      }
    } else {
      console.log('Still loading contacts or no customer selected');
    }
  }, [state.data.customer_id, state.data.contact_id, contacts.length, isLoadingContacts, contacts, showContactSelection]);


  const getCustomerTypeColor = (type?: string) => {
    const typeGradients = {
      'bars_restaurants': 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'construction': 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'emergency_disaster_relief': 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'events_festivals': 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'municipal_government': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'other': 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'private_events_weddings': 'bg-gradient-to-r from-pink-500 to-pink-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'retail': 'bg-gradient-to-r from-teal-500 to-teal-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'sports_recreation': 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'commercial': 'bg-gradient-to-r from-gray-600 to-gray-700 text-white border-0 font-bold px-3 py-1 rounded-full'
    };
    return typeGradients[type as keyof typeof typeGradients] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 font-bold px-3 py-1 rounded-full';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">
          {!state.data.customer_id ? 'Select Customer' : showContactSelection ? 'Select Contact' : 'Customer & Contact Selected'}
        </h2>
        <p className="text-muted-foreground">
          {!state.data.customer_id 
            ? 'Choose an existing customer for this job. Create customers in the Customers section first.'
            : showContactSelection 
            ? 'Choose a contact person for this job from the customer\'s contact list.'
            : 'Customer and contact have been selected for this job.'
          }
        </p>
      </div>

      {/* Customer Selection or Contact Selection */}
      {!state.data.customer_id ? (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search customers by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Customer List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading customers...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No customers found' : 'No customers available. Create customers in the Customers section first.'}
                </p>
              </div>
            ) : (
              customers.map((customer) => (
                <Card
                  key={customer.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    state.data.customer_id === customer.id && "ring-2 ring-primary bg-primary/5"
                  )}
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{customer.name}</h3>
                          {customer.customer_type && (
                            <Badge className={getCustomerTypeColor(customer.customer_type)}>
                              {formatCategoryDisplay(customer.customer_type)}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {customer.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3" />
                              {customer.address}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {state.data.customer_id === customer.id && (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                          <User className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      ) : showContactSelection ? (
        <div className="space-y-4">
          {/* Selected Customer Display */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Selected Customer</p>
                  <p className="text-sm text-muted-foreground">
                    {customers.find(c => c.id === state.data.customer_id)?.name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    updateData({ customer_id: undefined, contact_id: undefined });
                    setShowContactSelection(false);
                  }}
                  className="ml-auto"
                >
                  Change Customer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Selection */}
          {isLoadingContacts ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No contacts found for this customer.</p>
              <Button
                variant="outline"
                onClick={handleSkipContactSelection}
              >
                Continue without Contact
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <Card
                    key={contact.id}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/50",
                      state.data.contact_id === contact.id && "ring-2 ring-primary bg-primary/5"
                    )}
                    onClick={() => handleContactSelect(contact)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">
                              {contact.first_name} {contact.last_name}
                            </h3>
                            {contact.is_primary && (
                              <Badge variant="secondary">Primary</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {formatCategoryDisplay(contact.contact_type)}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {contact.title && (
                              <p className="font-medium text-foreground">{contact.title}</p>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                              </div>
                            )}
                            {contact.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {state.data.contact_id === contact.id && (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                            <User className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  onClick={handleSkipContactSelection}
                >
                  Skip Contact Selection
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Selected Customer & Contact Display */
        <div className="space-y-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Selected Customer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Customer</p>
                      <p className="text-sm text-muted-foreground">
                        {customers.find(c => c.id === state.data.customer_id)?.name}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateData({ customer_id: undefined, contact_id: undefined });
                      setShowContactSelection(false);
                    }}
                  >
                    Change Customer
                  </Button>
                </div>

                {/* Selected Contact */}
                {state.data.contact_id && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Contact</p>
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            const contact = contacts.find(c => c.id === state.data.contact_id);
                            return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown Contact';
                          })()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowContactSelection(true)}
                    >
                      Change Contact
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Validation Error */}
      {state.errors.customer && (
        <p className="text-sm text-destructive">{state.errors.customer}</p>
      )}
    </div>
  );
}