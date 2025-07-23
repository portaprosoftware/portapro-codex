
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
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Manage physical addresses for service locations
        </p>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
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
          <p className="text-muted-foreground mb-4">
            Add your first service location to get started
          </p>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
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
