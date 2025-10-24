
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServiceLocationCard } from './ServiceLocationCard';
import { AddServiceLocationModal } from './AddServiceLocationModal';
import { Button } from '@/components/ui/button';
import { Plus, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ServiceAddressesSectionProps {
  customerId: string;
}

export function ServiceAddressesSection({ customerId }: ServiceAddressesSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: serviceLocations, isLoading, refetch } = useQuery({
    queryKey: ['customer-service-locations', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_service_locations')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleLocationAdded = () => {
    refetch();
    setIsAddModalOpen(false);
    toast({
      title: "Success",
      description: "Service location added successfully",
    });
  };

  const handleLocationUpdated = () => {
    refetch();
    toast({
      title: "Success",
      description: "Service location updated successfully",
    });
  };

  const handleLocationDeleted = () => {
    refetch();
    toast({
      title: "Success",
      description: "Service location deleted successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted animate-pulse rounded-lg h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start lg:items-center gap-3">
        <div className="lg:order-2 lg:flex-1 lg:flex lg:justify-end lg:items-center lg:gap-3">
          <p className="text-sm text-muted-foreground">
            Manage physical addresses for customers with multiple service locations.
          </p>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold w-full sm:w-auto lg:flex-shrink-0 min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
        </div>
      </div>

      {serviceLocations && serviceLocations.length > 0 ? (
        <div className="space-y-4">
          {serviceLocations.map((location) => (
            <ServiceLocationCard
              key={location.id}
              location={location}
              onUpdate={handleLocationUpdated}
              onDelete={handleLocationDeleted}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No service locations</h3>
          <p className="text-muted-foreground mb-4 px-4">
            Add your first service location to get started
          </p>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
        </div>
      )}

      <AddServiceLocationModal
        customerId={customerId}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleLocationAdded}
      />
    </div>
  );
}
