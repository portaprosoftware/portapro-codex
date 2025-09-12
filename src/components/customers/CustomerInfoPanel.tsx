import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, MapPin, ExternalLink, Navigation, Copy, FileText, Trash2, AlertTriangle } from 'lucide-react';
import { EditCustomerModal } from './EditCustomerModal';
import { DeleteCustomerDrawer } from './DeleteCustomerDrawer';
import { toast } from '@/hooks/use-toast';
import { formatCategoryDisplay } from '@/lib/categoryUtils';
import { formatPhoneNumber } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Customer {
  id: string;
  name: string;
  customer_type: "events_festivals" | "construction" | "municipal_government" | "private_events_weddings" | "sports_recreation" | "emergency_disaster_relief" | "commercial" | "restaurants" | "retail" | "other" | "not_selected";
  email?: string;
  phone?: string;
  service_street: string;
  service_street2?: string;
  service_city: string;
  service_state: string;
  service_zip: string;
  billing_differs_from_service?: boolean;
  billing_street?: string;
  billing_street2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  default_service_differs_from_main?: boolean;
  default_service_street?: string;
  default_service_street2?: string;
  default_service_city?: string;
  default_service_state?: string;
  default_service_zip?: string;
  deposit_required?: boolean;
  created_at: string;
  updated_at: string;
  // Legacy fields for backward compatibility
  address?: string;
  important_information?: string;
  notes?: string;
}

interface CustomerInfoPanelProps {
  customer: Customer;
}

export function CustomerInfoPanel({ customer }: CustomerInfoPanelProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDeleteDrawer, setShowDeleteDrawer] = useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${label} has been copied to your clipboard.`,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  const getDepositStatusBadge = () => {
    if (customer.deposit_required === false) {
      return (
        <Badge variant="success" className="font-bold">
          No Deposit Needed
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="font-bold">
        Deposit Required
      </Badge>
    );
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

  const serviceAddress = formatAddress(
    customer.service_street, 
    customer.service_city, 
    customer.service_state, 
    customer.service_zip
  );
  const billingAddress = formatAddress(
    customer.billing_street,
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
                  {customer.customer_type ? formatCategoryDisplay(customer.customer_type) : 'Unknown'}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-foreground">{customer.email || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <p className="text-foreground">{formatPhoneNumber(customer.phone) || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Notes Card */}
      {customer.notes && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              General Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <p className="text-foreground whitespace-pre-wrap">
                {customer.notes.length > 300 ? (
                  <>
                    {customer.notes.substring(0, 300)}...
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setShowNotesModal(true)}
                      className="h-auto p-0 ml-1 text-xs text-primary"
                    >
                      View full notes
                    </Button>
                  </>
                ) : (
                  customer.notes
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Address */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Service Address
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Synchronized with default service location</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-start justify-between mb-3">
              <p className="text-foreground flex-1">{serviceAddress}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(serviceAddress, 'Service address')}
                className="h-8 w-8 p-0 ml-2"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            {customer.service_street && (
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
          <div className="flex items-start justify-between">
            <p className="text-foreground flex-1">{billingAddress}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(billingAddress, 'Billing address')}
              className="h-8 w-8 p-0 ml-2"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Status */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Deposit Status</CardTitle>
          <p className="text-xs text-muted-foreground">Deposit required by default</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div>
              <span className="text-muted-foreground block mb-2">Deposit Status</span>
              {getDepositStatusBadge()}
            </div>
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

      {/* Delete Customer Card */}
      <Card className="border-gray-200 bg-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-black text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-gray-600" />
            Delete Customer Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Permanently delete this customer and all associated data. This action cannot be undone.
          </p>
          <Button
            onClick={() => setShowDeleteDrawer(true)}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Customer Profile
          </Button>
        </CardContent>
      </Card>

      {/* Notes Modal */}
      {customer.notes && (
        <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                General Notes
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {customer.notes}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <EditCustomerModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        customer={customer}
      />

      <DeleteCustomerDrawer
        isOpen={showDeleteDrawer}
        onClose={() => setShowDeleteDrawer(false)}
        customer={customer}
      />
    </div>
  );
}