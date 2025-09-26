import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Users, 
  Camera, 
  FileText, 
  Thermometer,
  Droplets,
  User,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";

interface IncidentPhoto {
  id: string;
  photo_url: string;
  photo_type: string;
  description?: string;
}

interface IncidentWitness {
  id: string;
  name: string;
  contact_info: string;
}

interface IncidentData {
  id: string;
  created_at: string;
  vehicle_id: string;
  spill_type: string;
  location_description: string;
  cause_description: string;
  immediate_action_taken?: string;
  severity: 'minor' | 'moderate' | 'major' | 'reportable';
  volume_estimate?: number;
  volume_unit?: string;
  weather_conditions?: string;
  responsible_party: string;
  cleanup_actions?: string[];
  witnesses_present?: boolean;
  regulatory_notification_required?: boolean;
  regulatory_notification_sent?: boolean;
  status: string;
  photos?: IncidentPhoto[];
  witnesses?: IncidentWitness[];
  vehicles?: { license_plate: string };
}

interface Props {
  incident: IncidentData | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (incident: IncidentData) => void;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'minor':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'moderate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'major':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'reportable':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const IncidentDetailsModal: React.FC<Props> = ({ 
  incident, 
  isOpen, 
  onClose, 
  onEdit 
}) => {
  if (!incident) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div>{incident.spill_type} Spill Incident</div>
              <div className="text-sm font-normal text-muted-foreground">
                {format(new Date(incident.created_at), "EEEE, MMMM do, yyyy 'at' h:mm a")}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Status and Severity */}
            <div className="flex gap-3">
              <Badge className={getSeverityColor(incident.severity)}>
                <AlertTriangle className="h-3 w-3 mr-1" />
                {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)} Severity
              </Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                Status: {incident.status.replace('_', ' ')}
              </Badge>
              {incident.regulatory_notification_required && (
                <Badge variant="destructive">
                  EPA/State Reporting Required
                </Badge>
              )}
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 font-medium mb-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {incident.location_description}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 font-medium mb-2">
                    <User className="h-4 w-4" />
                    Vehicle & Responsible Party
                  </div>
                  <div className="pl-6 space-y-1">
                    <div className="text-sm">
                      <strong>Vehicle:</strong> {incident.vehicles?.license_plate || 'N/A'}
                    </div>
                    <div className="text-sm">
                      <strong>Responsible:</strong> {incident.responsible_party.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {(incident.volume_estimate || incident.weather_conditions) && (
                  <div>
                    <div className="flex items-center gap-2 font-medium mb-2">
                      <Thermometer className="h-4 w-4" />
                      Environmental Conditions
                    </div>
                    <div className="pl-6 space-y-1">
                      {incident.volume_estimate && (
                        <div className="text-sm flex items-center gap-2">
                          <Droplets className="h-3 w-3" />
                          <strong>Volume:</strong> {incident.volume_estimate} {incident.volume_unit}
                        </div>
                      )}
                      {incident.weather_conditions && (
                        <div className="text-sm">
                          <strong>Weather:</strong> {incident.weather_conditions}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 font-medium mb-2">
                    <Calendar className="h-4 w-4" />
                    Notifications
                  </div>
                  <div className="pl-6 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      {incident.regulatory_notification_required ? (
                        <CheckCircle className="h-3 w-3 text-orange-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-green-500" />
                      )}
                      Regulatory notification {incident.regulatory_notification_required ? 'required' : 'not required'}
                    </div>
                    {incident.regulatory_notification_required && (
                      <div className="flex items-center gap-2 text-sm">
                        {incident.regulatory_notification_sent ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        Notification {incident.regulatory_notification_sent ? 'sent' : 'pending'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Cause Description */}
            <div>
              <div className="font-medium mb-2">Cause Description</div>
              <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                {incident.cause_description}
              </p>
            </div>

            {/* Cleanup Actions */}
            {incident.cleanup_actions && incident.cleanup_actions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 font-medium mb-3">
                  <CheckCircle className="h-4 w-4" />
                  Cleanup Actions Taken
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {incident.cleanup_actions.map((action, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Immediate Action */}
            {incident.immediate_action_taken && (
              <div>
                <div className="font-medium mb-2">Additional Immediate Actions</div>
                <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                  {incident.immediate_action_taken}
                </p>
              </div>
            )}

            {/* Witnesses */}
            {incident.witnesses && incident.witnesses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 font-medium mb-3">
                  <Users className="h-4 w-4" />
                  Witnesses ({incident.witnesses.length})
                </div>
                <div className="space-y-2">
                  {incident.witnesses.map((witness) => (
                    <div key={witness.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium text-sm">{witness.name}</div>
                      {witness.contact_info && (
                        <div className="text-sm text-muted-foreground">{witness.contact_info}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {incident.photos && incident.photos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 font-medium mb-3">
                  <Camera className="h-4 w-4" />
                  Photos & Documentation ({incident.photos.length})
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {incident.photos.map((photo) => (
                    <div key={photo.id} className="space-y-2">
                      <img
                        src={photo.photo_url}
                        alt={photo.description || 'Incident photo'}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      {photo.description && (
                        <p className="text-xs text-muted-foreground text-center">
                          {photo.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button onClick={() => onEdit(incident)}>
              Edit Incident
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};