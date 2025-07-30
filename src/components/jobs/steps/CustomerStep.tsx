
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, User } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

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


  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-12 h-12 text-[#3366FF] mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Select Customer</h2>
        <p className="text-gray-600">Choose an existing customer</p>
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
            No customers found. Try adjusting your search.
          </div>
        )}
      </div>
    </div>
  );
};
