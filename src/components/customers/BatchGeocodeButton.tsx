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
      // Step 1: Reset failed geocoding statuses to pending
      const { data: cleanupData, error: cleanupError } = await supabase.rpc('cleanup_failed_geocoding');
      
      if (cleanupError) {
        console.error('Error resetting geocoding statuses:', cleanupError);
        toast({
          title: "Warning",
          description: "Could not reset all failed geocoding statuses. Proceeding with batch geocoding.",
          variant: "destructive"
        });
      } else {
        console.log('Geocoding statuses reset:', cleanupData);
        const result = cleanupData as any;
        toast({
          title: "Reset Complete",
          description: `${result?.locations_reset_for_geocoding || 0} locations reset for geocoding.`,
        });
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