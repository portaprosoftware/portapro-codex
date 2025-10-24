import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, MapPin, ExternalLink, Navigation, Copy, FileText, Trash2, AlertTriangle, Percent } from 'lucide-react';
import { EditCustomerModal } from './EditCustomerModal';
import { DeleteCustomerDrawer } from './DeleteCustomerDrawer';
import { EditDepositPercentageDialog } from './EditDepositPercentageDialog';
import { toast } from '@/hooks/use-toast';
import { formatCategoryDisplay } from '@/lib/categoryUtils';
import { formatPhoneNumber } from '@/lib/utils';
import { useCompanySettings } from '@/hooks/useCompanySettings';
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
  custom_deposit_percentage?: number | null;
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
  const [showDepositPercentageDialog, setShowDepositPercentageDialog] = useState(false);
  const { data: companySettings } = useCompanySettings();

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
        url = `https://maps.apple.com/?q=${encodedAddress}`;
        break;
      case 'waze':
        url = `https://www.waze.com/ul?q=${encodedAddress}`;
        break;
    }
    
    // Try to open in app first, then fallback to web
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="space-y-3 md:space-y-6">
      {/* Contact Information */}
      <Card className="rounded-xl md:rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
          <CardTitle className="text-base md:text-lg font-semibold">Contact Information</CardTitle>
          <Button
            onClick={() => setShowEditModal(true)}
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-md border-0 h-11 text-sm"
          >
            <Edit className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Edit</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 p-4 md:p-6">
          {/* Mobile: Stacked layout, Desktop: Grid */}
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium text-muted-foreground">Company Name</label>
              <p className="text-base md:text-base text-foreground font-semibold">{customer.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium text-muted-foreground">Customer Type</label>
              <div>
                <Badge className={getCustomerTypeColor(customer.customer_type)}>
                  {customer.customer_type ? formatCategoryDisplay(customer.customer_type) : 'Unknown'}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium text-muted-foreground">Email</label>
              <a 
                href={`mailto:${customer.email}`}
                className="text-base md:text-base text-foreground hover:text-primary block"
              >
                {customer.email || 'Not provided'}
              </a>
            </div>
            <div className="space-y-1">
              <label className="text-xs md:text-sm font-medium text-muted-foreground">Phone</label>
              <a 
                href={`tel:${customer.phone}`}
                className="text-base md:text-base text-foreground hover:text-primary block"
              >
                {formatPhoneNumber(customer.phone) || 'Not provided'}
              </a>
            </div>
          </div>
          <div className="flex justify-between items-center border-t pt-3 md:pt-4 text-sm md:text-base">
            <span className="text-muted-foreground">Customer Since</span>
            <span className="text-foreground font-medium">
              {new Date(customer.created_at).toLocaleDateString()}
            </span>
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
      <Card className="rounded-2xl border border-slate-200">
        <CardHeader className="p-4 sm:p-5 pb-2">
          <CardTitle className="text-base font-semibold flex items-center mb-1">
            <MapPin className="w-[18px] h-[18px] mr-2" />
            Service Address
          </CardTitle>
          <p className="text-xs text-muted-foreground">Synced with service location</p>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-2 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-slate-800 break-words flex-1">{serviceAddress}</p>
            {customer.service_street && (
              <button
                onClick={() => copyToClipboard(serviceAddress, 'Service address')}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 flex-shrink-0"
                aria-label="Copy address to clipboard"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            )}
          </div>
          
          {customer.service_street && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMapLink(serviceAddress, 'google')}
                className="inline-flex items-center justify-center h-11 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                aria-label="Open in Google Maps"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Google
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMapLink(serviceAddress, 'apple')}
                className="inline-flex items-center justify-center h-11 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                aria-label="Open in Apple Maps"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Apple
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMapLink(serviceAddress, 'waze')}
                className="inline-flex items-center justify-center h-11 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                aria-label="Open in Waze"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Waze
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card className="rounded-2xl border border-slate-200">
        <CardHeader className="p-4 sm:p-5 pb-2">
          <CardTitle className="text-base font-semibold">Billing Address</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-2">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-slate-800 break-words flex-1">{billingAddress}</p>
            <button
              onClick={() => copyToClipboard(billingAddress, 'Billing address')}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 flex-shrink-0"
              aria-label="Copy address to clipboard"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Status */}
      <Card className="rounded-2xl border border-slate-200">
        <CardHeader className="p-4 sm:p-5 pb-2">
          <div className="flex items-start justify-between">
            <h3 className="text-base font-semibold leading-tight">
              Deposit<br className="sm:hidden"/>
              <span className="hidden sm:inline"> </span>Status
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDepositPercentageDialog(true)}
              className="text-slate-600 hover:text-slate-900 inline-flex items-center h-auto p-1"
              aria-label="Edit deposit settings"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-2">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge 
              className={`px-3 py-1.5 rounded-full text-sm font-bold border-0 ${
                customer.deposit_required === false 
                  ? "bg-emerald-100 text-emerald-700" 
                  : "bg-gradient-to-r from-red-500 to-red-600 text-white"
              }`}
            >
              {customer.deposit_required === false ? "No Deposit" : "Deposit Required"}
            </Badge>
            
            <Badge className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-600 text-white border-0">
              Company Default
            </Badge>
            
            <Badge className="px-3 py-1.5 rounded-full text-lg font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 ml-auto">
              {customer.custom_deposit_percentage ?? companySettings?.default_deposit_percentage ?? 25}%
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {customer.custom_deposit_percentage !== null && customer.custom_deposit_percentage !== undefined
              ? `Overrides company default of ${companySettings?.default_deposit_percentage ?? 25}%`
              : 'Using company default'}
          </p>
          
          {customer.important_information && (
            <div className="border-t pt-3 mt-3">
              <span className="text-sm font-medium text-muted-foreground">Important Information</span>
              <p className="text-foreground mt-1">{customer.important_information}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Customer Card */}
      <Card className="border-gray-200 bg-gray-100 rounded-xl md:rounded-2xl">
        <CardHeader className="pb-3 p-4 md:p-6">
          <CardTitle className="text-black text-base md:text-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
            Delete Customer Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <p className="text-sm text-gray-600 mb-4">
            Permanently delete this customer and all associated data. This action cannot be undone.
          </p>
          <Button
            onClick={() => setShowDeleteDrawer(true)}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white w-full md:w-auto h-11"
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

      <EditDepositPercentageDialog
        isOpen={showDepositPercentageDialog}
        onClose={() => setShowDepositPercentageDialog(false)}
        customerId={customer.id}
        currentCustomPercentage={customer.custom_deposit_percentage}
        companyDefaultPercentage={companySettings?.default_deposit_percentage ?? 25}
      />
    </div>
  );
}