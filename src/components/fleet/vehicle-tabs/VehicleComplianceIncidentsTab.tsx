import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ExternalLink, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface VehicleComplianceIncidentsTabProps {
  vehicleId: string;
  licensePlate: string;
}

export function VehicleComplianceIncidentsTab({ vehicleId, licensePlate }: VehicleComplianceIncidentsTabProps) {
  const navigate = useNavigate();

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['vehicle-incidents', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spill_incident_reports')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('incident_date', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  const getSeverityBadge = (severity: string) => {
    const severityMap = {
      minor: { label: 'Minor', className: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold' },
      moderate: { label: 'Moderate', className: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold' },
      major: { label: 'Major', className: 'bg-gradient-to-r from-red-500 to-red-600 text-white font-bold' },
      critical: { label: 'Critical', className: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold' },
    };

    const info = severityMap[severity as keyof typeof severityMap] || severityMap.minor;
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: 'Draft', className: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold' },
      reported: { label: 'Reported', className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold' },
      investigating: { label: 'Investigating', className: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold' },
      resolved: { label: 'Resolved', className: 'bg-gradient-to-r from-green-500 to-green-600 text-white font-bold' },
      closed: { label: 'Closed', className: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold' },
    };

    const info = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return <Badge className={info.className}>{info.label}</Badge>;
  };

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
          <h3 className="font-semibold text-gray-900">Incident Reports</h3>
          <p className="text-sm text-gray-600">Spill and environmental incidents for {licensePlate}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/fleet/compliance?tab=incidents&vehicle=${vehicleId}&returnTo=/fleet-management`)}
          className="gap-2"
        >
          View All <ExternalLink className="w-3 h-3" />
        </Button>
      </div>

      {incidents && incidents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-4">No incidents recorded for this vehicle</p>
            <Button
              onClick={() => navigate(`/fleet/compliance?tab=incidents&vehicle=${vehicleId}&action=new-incident&returnTo=/fleet-management`)}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold"
            >
              Log Incident
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {incidents?.map((incident) => (
            <Card key={incident.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {getSeverityBadge(incident.severity)}
                        {getStatusBadge(incident.status)}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(incident.incident_date), 'MMM dd, yyyy \'at\' h:mm a')}</span>
                        </div>
                        {incident.location_description && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{incident.location_description}</span>
                          </div>
                        )}
                        {incident.cause_description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{incident.cause_description}</p>
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
          onClick={() => navigate(`/fleet/compliance?tab=incidents&vehicle=${vehicleId}&returnTo=/fleet-management`)}
          variant="outline"
          className="w-full"
        >
          View Full Incidents Section
        </Button>
      </div>
    </div>
  );
}
