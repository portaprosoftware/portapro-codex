import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVehicleIncidents } from '@/hooks/vehicle/useVehicleIncidents';
import { useVehicleDeconLogs } from '@/hooks/vehicle/useVehicleDeconLogs';
import { AddIncidentModal } from '@/components/fleet/spill-kit/AddIncidentModal';
import { AddDeconModal } from '@/components/fleet/spill-kit/AddDeconModal';
import { 
  AlertTriangle, 
  Plus, 
  ExternalLink, 
  Shield,
  Droplet
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface VehicleSpillKitTabProps {
  vehicleId: string;
  licensePlate: string;
}

function VehicleSpillKitTabContent({ 
  vehicleId, 
  licensePlate,
}: VehicleSpillKitTabProps) {
  const [showIncidentModal, setShowIncidentModal] = React.useState(false);
  const [showDeconModal, setShowDeconModal] = React.useState(false);

  const { data: incidents, isLoading: incidentsLoading } = useVehicleIncidents({
    vehicleId,
    limit: 5,
  });

  const { data: deconLogs, isLoading: deconLoading } = useVehicleDeconLogs({
    vehicleId,
    limit: 5,
  });

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'minor':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
      case 'moderate':
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'major':
      case 'severe':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Incidents */}
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Spill Incidents ({incidents?.total || 0})
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowIncidentModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Log Incident
            </Button>
            <Button variant="ghost" size="sm">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {incidentsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : incidents && incidents.items.length > 0 ? (
            <div className="space-y-3">
              {incidents.items.map((incident: any) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{incident.spill_type || 'Incident'}</p>
                      {incident.severity && (
                        <Badge className={cn("text-white font-bold", getSeverityColor(incident.severity))}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(incident.incident_date), 'MMM d, yyyy h:mm a')}
                    </p>
                    {incident.location && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Location: {incident.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No incidents recorded</p>
              <Button size="sm" onClick={() => setShowIncidentModal(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Log First Incident
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decon Logs */}
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Droplet className="w-5 h-5" />
            Decontamination Logs ({deconLogs?.total || 0})
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowDeconModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Record Decon
            </Button>
            <Button variant="ghost" size="sm">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {deconLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : deconLogs && deconLogs.items.length > 0 ? (
            <div className="space-y-3">
              {deconLogs.items.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <p className="font-medium text-sm">Decontamination Performed</p>
                      {log.post_inspection_status && (
                        <Badge className={cn(
                          "font-bold text-white",
                          log.post_inspection_status.toLowerCase() === 'pass'
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600'
                        )}>
                          {log.post_inspection_status.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                    {log.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Droplet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No decon logs yet</p>
              <Button size="sm" onClick={() => setShowDeconModal(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Record First Decon
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddIncidentModal 
        open={showIncidentModal}
        onOpenChange={setShowIncidentModal}
        vehicleContextId={vehicleId}
        vehicleContextName={licensePlate}
      />
      <AddDeconModal
        open={showDeconModal}
        onOpenChange={setShowDeconModal}
        vehicleContextId={vehicleId}
        vehicleContextName={licensePlate}
      />
    </div>
  );
}

export function VehicleSpillKitTab(props: VehicleSpillKitTabProps) {
  return <VehicleSpillKitTabContent {...props} />;
}
