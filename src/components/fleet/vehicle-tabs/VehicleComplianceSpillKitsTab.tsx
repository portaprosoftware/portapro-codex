import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, ExternalLink, CheckCircle, XCircle, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface VehicleComplianceSpillKitsTabProps {
  vehicleId: string;
  licensePlate: string;
}

export function VehicleComplianceSpillKitsTab({ vehicleId, licensePlate }: VehicleComplianceSpillKitsTabProps) {
  const navigate = useNavigate();

  const { data: spillKitChecks, isLoading } = useQuery({
    queryKey: ['vehicle-spill-kit-checks', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_spill_kit_checks')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Spill Kit Check History</h3>
          <p className="text-sm text-gray-600">Inspection records for {licensePlate}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/fleet/compliance?tab=spill-kits&vehicle=${vehicleId}&returnTo=/fleet-management`)}
          className="gap-2"
        >
          View All <ExternalLink className="w-3 h-3" />
        </Button>
      </div>

      {spillKitChecks && spillKitChecks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-4">No spill kit checks recorded for this vehicle</p>
            <Button
              onClick={() => navigate(`/fleet/compliance?tab=spill-kits&vehicle=${vehicleId}&action=new-check&returnTo=/fleet-management`)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold"
            >
              Record First Check
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {spillKitChecks?.map((check) => (
            <Card key={check.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      check.has_kit 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}>
                      {check.has_kit ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <XCircle className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={check.has_kit 
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white font-bold'
                          : 'bg-gradient-to-r from-red-500 to-red-600 text-white font-bold'
                        }>
                          {check.has_kit ? 'Kit Present' : 'Kit Missing'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(check.created_at), 'MMM dd, yyyy \'at\' h:mm a')}</span>
                        </div>
                        {check.notes && (
                          <p className="text-xs text-gray-500 line-clamp-2">{check.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="pt-2">
        <Button
          onClick={() => navigate(`/fleet/compliance?tab=spill-kits&vehicle=${vehicleId}&returnTo=/fleet-management`)}
          variant="outline"
          className="w-full"
        >
          View Full Spill Kit Compliance Section
        </Button>
      </div>
    </div>
  );
}
