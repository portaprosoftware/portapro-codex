import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VehicleOOSWarningProps {
  vehicleId: string | null;
  compact?: boolean;
}

export const VehicleOOSWarning: React.FC<VehicleOOSWarningProps> = ({
  vehicleId,
  compact = false,
}) => {
  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle-oos-status', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;

      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, out_of_service, make, model, year')
        .eq('id', vehicleId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!vehicleId,
    staleTime: 30 * 1000, // 30 seconds
  });

  if (isLoading || !vehicle || !vehicle.out_of_service) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-300 rounded text-xs text-red-800">
        <AlertTriangle className="h-3 w-3" />
        <span className="font-semibold">Out of Service</span>
      </div>
    );
  }

  return (
    <Alert variant="destructive" className="mb-3">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>⚠️ Warning:</strong> Vehicle{' '}
        <strong>
          {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.license_plate})
        </strong>{' '}
        is currently out of service and unavailable for dispatch.
      </AlertDescription>
    </Alert>
  );
};
