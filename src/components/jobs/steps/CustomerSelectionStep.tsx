import React, { useState } from 'react';
import { Search, Plus, Building2, User, Phone, Mail } from 'lucide-react';
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

export function CustomerSelectionStep() {
  const { state, updateData } = useJobWizard();
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleCustomerSelect = (customer: Customer) => {
    updateData({
      customer_id: customer.id,
    });
  };


  const getCustomerTypeColor = (type?: string) => {
    const typeGradients = {
      'events_festivals': 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'sports_recreation': 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0 font-bold px-3 py-1 rounded-full', 
      'municipal_government': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'commercial': 'bg-gradient-to-r from-gray-600 to-gray-700 text-white border-0 font-bold px-3 py-1 rounded-full',
      'construction': 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'emergency_disaster_relief': 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0 font-bold px-3 py-1 rounded-full',
      'private_events_weddings': 'bg-gradient-to-r from-pink-500 to-pink-600 text-white border-0 font-bold px-3 py-1 rounded-full'
    };
    return typeGradients[type as keyof typeof typeGradients] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 font-bold px-3 py-1 rounded-full';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Select Customer</h2>
        <p className="text-muted-foreground">
          Choose an existing customer for this job. Create customers in the Customers section first.
        </p>
      </div>

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
                    <div className="flex items-center gap-2 mb-2">
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

      {/* Validation Error */}
      {state.errors.customer && (
        <p className="text-sm text-destructive">{state.errors.customer}</p>
      )}
    </div>
  );
}