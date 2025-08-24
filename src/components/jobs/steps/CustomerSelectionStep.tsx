import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Search, User, Users, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  customer_type?: string;
}

interface CustomerContact {
  id: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  title?: string;
  contact_type: string;
  is_primary?: boolean;
  notes?: string;
}

const formatCategoryDisplay = (category?: string) => {
  if (!category) return 'Not Selected';
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function CustomerSelectionStep() {
  const { state, updateData, nextStep } = useJobWizard();
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactSelection, setShowContactSelection] = useState(false);

  // Fetch customers
  const { 
    data: customers = [], 
    isLoading: isLoadingCustomers 
  } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, email, customer_type')
        .order('name');
      
      if (error) throw error;
      return data as Customer[];
    }
  });

  // Fetch contacts for selected customer
  const { 
    data: contacts = [], 
    isLoading: isLoadingContacts 
  } = useQuery({
    queryKey: ['customer-contacts', state.data.customer_id],
    queryFn: async () => {
      if (!state.data.customer_id) return [];
      
      const { data, error } = await supabase
        .from('customer_contacts')
        .select('*')
        .eq('customer_id', state.data.customer_id)
        .order('is_primary', { ascending: false });
      
      if (error) throw error;
      return data as CustomerContact[];
    },
    enabled: !!state.data.customer_id
  });

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchQuery)) ||
    (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCustomerSelect = (customer: Customer) => {
    console.log('Customer selected:', customer.name);
    updateData({ 
      customer_id: customer.id,
      contact_id: undefined // Clear any previously selected contact
    });
  };

  const handleContactSelect = (contact: CustomerContact) => {
    console.log('Contact selected:', contact.first_name, contact.last_name);
    updateData({ contact_id: contact.id });
    setShowContactSelection(false);
  };

  const handleSkipContactSelection = () => {
    console.log('Skipping contact selection');
    updateData({ contact_id: undefined });
    setShowContactSelection(false);
  };

  // Auto-handle contact selection logic
  useEffect(() => {
    console.log('CustomerSelection useEffect triggered:', {
      customer_id: state.data.customer_id,
      contact_id: state.data.contact_id,
      isLoadingContacts,
      contactsLength: contacts.length,
      currentStep: state.currentStep,
      showContactSelection
    });
    
    if (state.data.customer_id && !isLoadingContacts && state.currentStep === 1) {
      if (contacts.length === 0) {
        console.log('No contacts found, auto-advancing to next step');
        // No contacts exist - clear contact_id and automatically skip to next step
        updateData({ contact_id: undefined });
        setShowContactSelection(false);
        nextStep();
      } else if (!state.data.contact_id && !showContactSelection) {
        console.log('Contacts exist but none selected, showing contact selection');
        // Contacts exist but none selected - show contact selection
        setShowContactSelection(true);
      }
    }
  }, [state.data.customer_id, state.data.contact_id, contacts.length, isLoadingContacts, state.currentStep, showContactSelection]);

  const getCustomerTypeColor = (type?: string) => {
    const typeGradients = {
      'bars_restaurants': 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'hotels_lodging': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'construction': 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'festivals_events': 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'events_festivals': 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'government_municipalities': 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'municipal_government': 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'healthcare_medical': 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'industrial_manufacturing': 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'not_selected': 'bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0 font-bold px-3 py-1 rounded-full',
      'other': 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'private_events_weddings': 'bg-gradient-to-r from-pink-500 to-pink-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'retail': 'bg-gradient-to-r from-teal-500 to-teal-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'sports_recreation': 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'commercial': 'bg-gradient-to-r from-slate-600 to-slate-700 text-white border-0 font-bold px-3 py-1 rounded-full',
      'emergency_disaster_relief': 'bg-gradient-to-r from-red-600 to-red-700 text-white border-0 font-bold px-3 py-1 rounded-full'
    };
    return typeGradients[type as keyof typeof typeGradients] || 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 font-bold px-3 py-1 rounded-full';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">
          {!state.data.customer_id ? 'Select Customer' : showContactSelection ? 'Select Contact' : 'Customer Selected'}
        </h2>
        <p className="text-muted-foreground">
          {!state.data.customer_id 
            ? 'Choose an existing customer for this job. Create customers in the Customers section first.'
            : showContactSelection 
            ? 'Choose a contact for this customer or continue without selecting one.'
            : 'Customer has been selected for this job.'}
        </p>
      </div>

      {!state.data.customer_id ? (
        /* Customer Selection */
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium">Select Customer</h3>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
          
          <div className="grid gap-3">{/* Removed max-h-96 overflow-y-auto to let parent handle scrolling */}
            {isLoadingCustomers ? (
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
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No customers match your search</p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <Card
                  key={customer.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-medium">{customer.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getCustomerTypeColor(customer.customer_type)}>
                              {formatCategoryDisplay(customer.customer_type)}
                            </Badge>
                            {customer.phone && (
                              <span className="text-xs text-muted-foreground">
                                {customer.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      ) : showContactSelection ? (
        /* Contact Selection */
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

              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleSkipContactSelection}
                >
                  Continue without Contact Selection
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Selected Customer Display - Only shows when customer is selected and not in contact selection mode */
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

                {/* Selected Contact - Only show if contact is actually selected */}
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
                
                {/* Show "No Contact" message when customer has no contacts */}
                {!state.data.contact_id && !isLoadingContacts && contacts.length === 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Contact</p>
                        <p className="text-sm text-muted-foreground">No contacts available for this customer</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Customer{state.data.contact_id ? ' and contact have' : ' has'} been selected for this job.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}