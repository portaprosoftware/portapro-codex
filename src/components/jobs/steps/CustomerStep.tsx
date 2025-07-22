
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Customer {
  id: string;
  name: string;
  address: string;
  email?: string;
  phone?: string;
}

interface CustomerStepProps {
  data: {
    id: string;
    name: string;
    address: string;
  } | null;
  onUpdate: (customer: { id: string; name: string; address: string; } | null) => void;
}

export const CustomerStep: React.FC<CustomerStepProps> = ({ data, onUpdate }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(true);

  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    serviceStreet: '',
    serviceCity: '',
    serviceState: '',
    serviceZip: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data: customersData, error } = await supabase
        .from('customers')
        .select('id, name, email, phone, billing_street, billing_city, billing_state, billing_zip, service_street, service_city, service_state, service_zip')
        .order('name');

      if (error) throw error;

      const formattedCustomers = customersData?.map(customer => ({
        id: customer.id,
        name: customer.name,
        address: `${customer.service_street || customer.billing_street}, ${customer.service_city || customer.billing_city}, ${customer.service_state || customer.billing_state} ${customer.service_zip || customer.billing_zip}`,
        email: customer.email,
        phone: customer.phone,
      })) || [];

      setCustomers(formattedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      const { data: customerData, error } = await supabase
        .from('customers')
        .insert({
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone,
          billing_street: newCustomer.billingStreet,
          billing_city: newCustomer.billingCity,
          billing_state: newCustomer.billingState,
          billing_zip: newCustomer.billingZip,
          service_street: newCustomer.serviceStreet || newCustomer.billingStreet,
          service_city: newCustomer.serviceCity || newCustomer.billingCity,
          service_state: newCustomer.serviceState || newCustomer.billingState,
          service_zip: newCustomer.serviceZip || newCustomer.billingZip,
          type: 'business',
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local list
      const formattedCustomer = {
        id: customerData.id,
        name: customerData.name,
        address: `${customerData.service_street}, ${customerData.service_city}, ${customerData.service_state} ${customerData.service_zip}`,
        email: customerData.email,
        phone: customerData.phone,
      };

      setCustomers(prev => [...prev, formattedCustomer]);
      onUpdate(formattedCustomer);
      setIsAddingNew(false);
      
      // Reset form
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        billingStreet: '',
        billingCity: '',
        billingState: '',
        billingZip: '',
        serviceStreet: '',
        serviceCity: '',
        serviceState: '',
        serviceZip: '',
      });
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-12 h-12 text-[#3366FF] mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Select Customer</h2>
        <p className="text-gray-600">Choose an existing customer or add a new one</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customer List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading customers...</div>
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => (
            <div
              key={customer.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:border-[#3366FF] ${
                data?.id === customer.id
                  ? 'border-[#3366FF] bg-blue-50'
                  : 'border-gray-200'
              }`}
              onClick={() => onUpdate(customer)}
            >
              <div className="font-medium text-gray-900">{customer.name}</div>
              <div className="text-sm text-gray-600">{customer.address}</div>
              {customer.email && (
                <div className="text-sm text-gray-500">{customer.email}</div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No customers found. Try adjusting your search or add a new customer.
          </div>
        )}
      </div>

      {/* Add New Customer Button */}
      <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full border-dashed border-2 border-gray-300 hover:border-[#3366FF] hover:bg-blue-50">
            <Plus className="w-4 h-4 mr-2" />
            Add New Customer
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Company/Customer Name *</Label>
              <Input
                id="name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter customer name"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                placeholder="customer@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="col-span-2">
              <h3 className="font-medium text-gray-900 mb-3">Service Address</h3>
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="serviceStreet">Street Address</Label>
              <Input
                id="serviceStreet"
                value={newCustomer.serviceStreet}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, serviceStreet: e.target.value }))}
                placeholder="123 Main Street"
              />
            </div>
            
            <div>
              <Label htmlFor="serviceCity">City</Label>
              <Input
                id="serviceCity"
                value={newCustomer.serviceCity}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, serviceCity: e.target.value }))}
                placeholder="City"
              />
            </div>
            
            <div>
              <Label htmlFor="serviceState">State</Label>
              <Input
                id="serviceState"
                value={newCustomer.serviceState}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, serviceState: e.target.value }))}
                placeholder="State"
              />
            </div>
            
            <div>
              <Label htmlFor="serviceZip">ZIP Code</Label>
              <Input
                id="serviceZip"
                value={newCustomer.serviceZip}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, serviceZip: e.target.value }))}
                placeholder="12345"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsAddingNew(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCustomer}
              disabled={!newCustomer.name || !newCustomer.serviceStreet}
              className="bg-gradient-to-r from-[#3366FF] to-[#6699FF] hover:from-[#2952CC] hover:to-[#5580E6] text-white"
            >
              Create Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
