import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Camera, Users, Calendar, MapPin, FileText, Eye } from "lucide-react";
import { format } from "date-fns";

interface IncidentPhoto {
  id: string;
  photo_url: string;
  photo_type: string;
}

interface IncidentWitness {
  id: string;
  name: string;
  contact_info: string;
}

interface EnhancedIncidentData {
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
  incident: EnhancedIncidentData;
  onViewDetails?: (incident: EnhancedIncidentData) => void;
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'closed':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const EnhancedIncidentCard: React.FC<Props> = ({ incident, onViewDetails }) => {
  const photoCount = incident.photos?.length || 0;
  const witnessCount = incident.witnesses?.length || 0;
  const cleanupActionCount = incident.cleanup_actions?.length || 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="font-semibold text-lg">
                {incident.spill_type} Spill
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(incident.created_at), "MMM dd, yyyy 'at' h:mm a")}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={getSeverityColor(incident.severity)}>
              {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
            </Badge>
            <Badge className={getStatusColor(incident.status)}>
              {incident.status.replace('_', ' ').charAt(0).toUpperCase() + incident.status.replace('_', ' ').slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <strong>Vehicle:</strong> {incident.vehicles?.license_plate || 'N/A'}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{incident.location_description}</span>
            </div>
            {incident.volume_estimate && (
              <div className="flex items-center gap-2 text-sm">
                <strong>Volume:</strong> {incident.volume_estimate} {incident.volume_unit}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <strong>Responsible:</strong> {incident.responsible_party.replace('_', ' ')}
            </div>
            {incident.weather_conditions && (
              <div className="flex items-center gap-2 text-sm">
                <strong>Weather:</strong> {incident.weather_conditions}
              </div>
            )}
            {incident.regulatory_notification_required && (
              <Badge variant="destructive" className="text-xs">
                EPA/State Reporting Required
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Cause Description */}
        <div>
          <div className="font-medium text-sm mb-1">Cause:</div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {incident.cause_description}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm text-muted-foreground">
            {photoCount > 0 && (
              <div className="flex items-center gap-1">
                <Camera className="h-4 w-4" />
                <span>{photoCount} photo{photoCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {witnessCount > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{witnessCount} witness{witnessCount !== 1 ? 'es' : ''}</span>
              </div>
            )}
            {cleanupActionCount > 0 && (
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{cleanupActionCount} action{cleanupActionCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(incident)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};