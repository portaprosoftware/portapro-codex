import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { 
  Package, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  Truck 
} from 'lucide-react';

interface SpillKitCheck {
  id: string;
  vehicle_id: string;
  checked_by_clerk: string;
  checked_at: string;
  completion_status: string;
  notes: string | null;
  has_kit: boolean;
  vehicles: {
    license_plate: string;
    make: string;
    model: string;
    nickname: string | null;
  };
}

export function SpillKitHistory() {
  const navigate = useNavigate();

  const { data: recentChecks, isLoading } = useQuery({
    queryKey: ['spill-kit-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_spill_kit_checks')
        .select(`
          *,
          vehicles(license_plate, make, model, nickname)
        `)
        .order('checked_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  const getStatusIcon = (status: string, hasKit: boolean) => {
    if (!hasKit) {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'needs_attention':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string, hasKit: boolean) => {
    if (!hasKit) {
      return <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0">No Kit</Badge>;
    }
    switch (status) {
      case 'complete':
        return <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0">Complete</Badge>;
      case 'needs_attention':
        return <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0">Needs Attention</Badge>;
      case 'in_progress':
        return <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0">In Progress</Badge>;
      default:
        return <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0">Unknown</Badge>;
    }
  };

  const getVehicleName = (vehicle: any) => {
    if (vehicle?.make && vehicle?.model) {
      return `${vehicle.make} ${vehicle.model}${vehicle.nickname ? ` - ${vehicle.nickname}` : ''}`;
    }
    return 'Unknown Vehicle';
  };

  const handleViewDetails = (vehicleId: string, licensePlate: string) => {
    navigate(`/fleet?vehicle_id=${vehicleId}&vehicle_name=${encodeURIComponent(licensePlate)}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Spill Kit Check History</h3>
        <p className="text-sm text-gray-600">Recent spill kit inspections and compliance checks</p>
      </div>

      {recentChecks && recentChecks.length > 0 ? (
        <div className="space-y-4">
          {recentChecks.map((check) => (
            <Card key={check.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getStatusIcon(check.completion_status, check.has_kit)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {getVehicleName(check.vehicles)}
                        </h4>
                        {getStatusBadge(check.completion_status, check.has_kit)}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-blue-600 font-medium">{check.vehicles?.license_plate}</span>
                        <span>•</span>
                        <span>{format(new Date(check.checked_at), 'MMM d, yyyy')}</span>
                        {check.notes && (
                          <>
                            <span>•</span>
                            <span className="truncate">{check.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(check.vehicle_id, check.vehicles.license_plate)}
                    className="gap-2 flex-shrink-0 ml-4"
                  >
                    <Truck className="w-4 h-4" />
                    View Vehicle
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No spill kit checks recorded yet</p>
            <p className="text-sm mt-1">Start by performing an inspection</p>
          </div>
        </Card>
      )}
    </div>
  );
}
