import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, MapPin, ExternalLink, Navigation } from 'lucide-react';
import { EditCustomerModal } from './EditCustomerModal';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  customer_type?: string;
  important_information?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CustomerInfoPanelProps {
  customer: Customer;
}

export function CustomerInfoPanel({ customer }: CustomerInfoPanelProps) {
  const [showEditModal, setShowEditModal] = useState(false);

   const getCustomerTypeColor = (type?: string) => {
     switch (type) {
       case 'commercial': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 font-medium px-3 py-1 rounded-full';
       case 'residential': return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0 font-medium px-3 py-1 rounded-full';
       case 'government': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 font-medium px-3 py-1 rounded-full';
       case 'event': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 font-medium px-3 py-1 rounded-full';
       default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 font-medium px-3 py-1 rounded-full';
     }
   };

  const formatAddress = (address?: string, city?: string, state?: string, zip?: string) => {
    const parts = [address, city, state, zip].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'No address provided';
  };

  const handleMapLink = (address: string, service: 'google' | 'apple' | 'waze') => {
    const encodedAddress = encodeURIComponent(address);
    let url = '';
    
    switch (service) {
      case 'google':
        url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        break;
      case 'apple':
        url = `http://maps.apple.com/?q=${encodedAddress}`;
        break;
      case 'waze':
        url = `https://waze.com/ul?q=${encodedAddress}`;
        break;
    }
    
    window.open(url, '_blank');
  };

  const serviceAddress = formatAddress(customer.address);
  const billingAddress = formatAddress(
    customer.billing_address,
    customer.billing_city,
    customer.billing_state,
    customer.billing_zip
  );

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Contact Information</CardTitle>
          <Button
            onClick={() => setShowEditModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-4 py-2 rounded-md border-0"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Company Name</label>
              <p className="text-foreground font-medium">{customer.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Customer Type</label>
              <div className="mt-1">
                <Badge className={getCustomerTypeColor(customer.customer_type)}>
                  {customer.customer_type || 'Unknown'}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-foreground">{customer.email || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <p className="text-foreground">{customer.phone || 'Not provided'}</p>
            </div>
          </div>
          
          {/* General Notes */}
          <div className="mt-4 pt-4 border-t border-border">
            <label className="text-sm font-medium text-muted-foreground">General Notes</label>
            <p className="text-foreground mt-1">
              {customer.notes || 'gate code is 1234'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Service Address */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Service Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-foreground mb-3">{serviceAddress}</p>
            {customer.address && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMapLink(serviceAddress, 'google')}
                  className="flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Google Maps
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMapLink(serviceAddress, 'apple')}
                  className="flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Apple Maps
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMapLink(serviceAddress, 'waze')}
                  className="flex items-center"
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  Waze
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Billing Address</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">{billingAddress}</p>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Account Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Credit Status</span>
            <Badge className="bg-green-100 text-green-800">Good Standing</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Deposit Required</span>
            <span className="text-foreground">No</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Customer Since</span>
            <span className="text-foreground">
              {new Date(customer.created_at).toLocaleDateString()}
            </span>
          </div>
          {customer.important_information && (
            <div className="border-t pt-3 mt-3">
              <span className="text-sm font-medium text-muted-foreground">Important Information</span>
              <p className="text-foreground mt-1">{customer.important_information}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <EditCustomerModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        customer={customer}
      />
    </div>
  );
}