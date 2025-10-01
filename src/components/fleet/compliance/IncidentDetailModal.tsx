import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { X, Calendar, MapPin, Truck, AlertTriangle, User, FileText, Camera, Users, Wind } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface IncidentPhoto {
  id: string;
  photo_url: string;
  photo_type: string;
}

interface IncidentWitness {
  id: string;
  name: string;
  contact_info?: string;
}

interface IncidentData {
  id: string;
  created_at: string;
  incident_date: string;
  vehicle_id: string;
  spill_type: string;
  location_description: string;
  cause_description: string;
  severity: string;
  volume_estimate?: number;
  volume_unit?: string;
  weather_conditions?: string;
  responsible_party: string;
  immediate_action_taken?: string;
  cleanup_actions: string[];
  witnesses_present: boolean;
  regulatory_notification_required: boolean;
  regulatory_notification_sent: boolean;
  authorities_notified: boolean;
  status: string;
  driver_id?: string;
  vehicles?: {
    license_plate: string;
    make?: string;
    model?: string;
  };
  incident_photos?: IncidentPhoto[];
  incident_witnesses?: IncidentWitness[];
}

interface Props {
  incident: IncidentData;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (incident: IncidentData) => void;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "minor":
      return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
    case "moderate":
      return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold border-0";
    case "major":
      return "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0";
    case "reportable":
      return "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0";
    default:
      return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending_review":
      return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold border-0";
    case "under_investigation":
      return "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0";
    case "open":
      return "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0";
    case "closed":
      return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
    default:
      return "bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold border-0";
  }
};

export const IncidentDetailsModal: React.FC<Props> = ({ incident, isOpen, onClose, onEdit }) => {
  const { hasAdminAccess, isDriver, userId } = useUserRole();

  const canEdit = useMemo(() => {
    if (hasAdminAccess) return true;
    if (!isDriver) return false;
    
    // Drivers can edit their own incidents until EOD
    const incidentDate = new Date(incident.created_at);
    const now = new Date();
    const isToday = incidentDate.toDateString() === now.toDateString();
    const isOwnIncident = incident.driver_id === userId;
    
    return isOwnIncident && isToday;
  }, [hasAdminAccess, isDriver, incident, userId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Incident Details</span>
            <div className="flex items-center gap-2">
              {canEdit && onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(incident)}
                >
                  Edit
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="space-y-6 pr-4">
            {/* Status and Severity */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getStatusColor(incident.status)}>
                {incident.status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </Badge>
              <Badge className={getSeverityColor(incident.severity)}>
                {incident.severity.replace(/\b\w/g, (l: string) => l.toUpperCase())} Severity
              </Badge>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    Incident Date
                  </div>
                  <p className="text-sm font-medium">
                    {format(new Date(incident.incident_date), "MMMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Truck className="h-4 w-4" />
                    Vehicle
                  </div>
                  <p className="text-sm font-medium">
                    {incident.vehicles?.license_plate || "Unknown"} 
                    {incident.vehicles?.make && ` (${incident.vehicles.make} ${incident.vehicles.model})`}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    Spill Type
                  </div>
                  <p className="text-sm font-medium">{incident.spill_type}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <User className="h-4 w-4" />
                    Responsible Party
                  </div>
                  <p className="text-sm font-medium">{incident.responsible_party.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Location
              </div>
              <p className="text-sm">{incident.location_description}</p>
            </div>

            <Separator />

            {/* Cause */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                Cause
              </div>
              <p className="text-sm">{incident.cause_description}</p>
            </div>

            {/* Immediate Action */}
            {incident.immediate_action_taken && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Immediate Action Taken
                  </div>
                  <p className="text-sm">{incident.immediate_action_taken}</p>
                </div>
              </>
            )}

            {/* Volume (if available) */}
            {incident.volume_estimate && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    Volume Estimate
                  </div>
                  <p className="text-sm font-medium">
                    {incident.volume_estimate} {incident.volume_unit}
                  </p>
                </div>
              </>
            )}

            {/* Weather */}
            {incident.weather_conditions && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wind className="h-4 w-4" />
                    Weather Conditions
                  </div>
                  <p className="text-sm">{incident.weather_conditions}</p>
                </div>
              </>
            )}

            {/* Cleanup Actions */}
            {incident.cleanup_actions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Cleanup Actions
                  </div>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {incident.cleanup_actions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Witnesses */}
            {incident.incident_witnesses && incident.incident_witnesses.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Witnesses
                  </div>
                  <div className="space-y-2">
                    {incident.incident_witnesses.map((witness) => (
                      <div key={witness.id} className="text-sm p-2 bg-muted rounded">
                        <p className="font-medium">{witness.name}</p>
                        {witness.contact_info && (
                          <p className="text-xs text-muted-foreground">{witness.contact_info}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Photos */}
            {incident.incident_photos && incident.incident_photos.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Camera className="h-4 w-4" />
                    Photos ({incident.incident_photos.length})
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {incident.incident_photos.map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={photo.photo_url}
                          alt="Incident"
                          className="w-full h-32 object-cover rounded hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Regulatory Notifications */}
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Regulatory Notification Required</div>
                <Badge variant={incident.regulatory_notification_required ? "destructive" : "secondary"}>
                  {incident.regulatory_notification_required ? "Yes" : "No"}
                </Badge>
              </div>
              {incident.regulatory_notification_required && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Notification Sent</div>
                  <Badge variant={incident.regulatory_notification_sent ? "default" : "destructive"}>
                    {incident.regulatory_notification_sent ? "Yes" : "Pending"}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
