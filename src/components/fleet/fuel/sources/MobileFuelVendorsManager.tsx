import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Truck, Phone, Mail, Calendar } from 'lucide-react';
import { useMobileFuelVendors } from '@/hooks/useMobileFuelVendors';
import { useMobileFuelServices } from '@/hooks/useMobileFuelServices';
import { AddMobileFuelVendorDialog } from './AddMobileFuelVendorDialog';
import { AddMobileFuelServiceDialog } from './AddMobileFuelServiceDialog';
import { format } from 'date-fns';

export const MobileFuelVendorsManager: React.FC = () => {
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | undefined>();

  const { data: vendors = [], isLoading } = useMobileFuelVendors();
  const { data: services = [] } = useMobileFuelServices();

  const handleAddService = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setShowAddService(true);
  };

  if (isLoading) {
    return <div>Loading vendors...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
              <Truck className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Vendors</p>
              <p className="text-2xl font-bold">{vendors.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
              <Calendar className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Services</p>
              <p className="text-2xl font-bold">{services.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Vendor Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Mobile Fuel Vendors</h3>
        <Button onClick={() => setShowAddVendor(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Vendors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vendors.map((vendor) => (
          <Card key={vendor.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{vendor.vendor_name}</h4>
                  {vendor.contact_person && (
                    <p className="text-sm text-muted-foreground">{vendor.contact_person}</p>
                  )}
                </div>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  {vendor.fuel_type}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {vendor.phone}
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {vendor.email}
                  </div>
                )}
              </div>

              {vendor.service_area && (
                <div className="text-xs text-muted-foreground">
                  Service area: {vendor.service_area}
                </div>
              )}

              {vendor.contract_number && (
                <div className="text-xs text-muted-foreground">
                  Contract: {vendor.contract_number}
                </div>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleAddService(vendor.id)}
              >
                Log Service
              </Button>
            </div>
          </Card>
        ))}

        {vendors.length === 0 && (
          <Card className="p-8 col-span-full text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-semibold mb-2">No Mobile Fuel Vendors</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add mobile fueling vendors to track wet hosing services
            </p>
            <Button onClick={() => setShowAddVendor(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </Card>
        )}
      </div>

      <AddMobileFuelVendorDialog open={showAddVendor} onOpenChange={setShowAddVendor} />
      <AddMobileFuelServiceDialog 
        open={showAddService} 
        onOpenChange={setShowAddService}
        vendorId={selectedVendorId}
      />
    </div>
  );
};
