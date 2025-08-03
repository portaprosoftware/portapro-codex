import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { useCustomerGeocoding } from '@/hooks/useCustomerGeocoding';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function BatchGeocodeButton() {
  const { batchGeocodeExistingLocations, isGeocoding } = useCustomerGeocoding();
  const { toast } = useToast();

  const handleBatchProcess = async () => {
    try {
      // Step 1: Create default service locations for existing customers
      const { data, error } = await supabase.rpc('create_default_service_locations');
      
      if (error) {
        console.error('Error creating default service locations:', error);
        toast({
          title: "Warning",
          description: "Could not create all default service locations. Proceeding with geocoding.",
          variant: "destructive"
        });
      } else {
        console.log('Default service locations created');
      }

      // Step 2: Batch geocode all locations that need coordinates
      await batchGeocodeExistingLocations();
      
    } catch (error) {
      console.error('Batch process failed:', error);
      toast({
        title: "Error",
        description: "Failed to complete batch geocoding process.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button
      onClick={handleBatchProcess}
      disabled={isGeocoding}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isGeocoding ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MapPin className="h-4 w-4" />
      )}
      {isGeocoding ? 'Processing...' : 'Fix Missing GPS Data'}
    </Button>
  );
}