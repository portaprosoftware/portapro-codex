import React from 'react';
import { AlertTriangle, Clock, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSecurityIncidents } from '@/hooks/usePadlockSecurity';

export const SecurityIncidentsWidget: React.FC = () => {
  const { data: incidents, isLoading } = useSecurityIncidents('open');

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Security Incidents</CardTitle>
          <Shield className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const openIncidents = incidents?.filter(incident => incident.status === 'open') || [];
  const criticalIncidents = openIncidents.filter(incident => incident.severity === 'critical');
  const highIncidents = openIncidents.filter(incident => incident.severity === 'high');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getIncidentTypeLabel = (type: string) => {
    switch (type) {
      case 'missing_padlock': return 'Missing Padlock';
      case 'damaged_padlock': return 'Damaged Padlock';
      case 'unauthorized_access': return 'Unauthorized Access';
      case 'lost_key': return 'Lost Key';
      case 'forgotten_combination': return 'Forgotten Combination';
      default: return type;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Security Incidents</CardTitle>
        <Shield className={`h-4 w-4 ${openIncidents.length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-red-600">{openIncidents.length}</div>
        <p className="text-xs text-muted-foreground">
          Open incidents requiring attention
        </p>
        
        {criticalIncidents.length > 0 && (
          <div className="mt-2">
            <Badge variant="destructive" className="text-xs">
              {criticalIncidents.length} Critical
            </Badge>
          </div>
        )}
        
        {openIncidents.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-red-700">Recent Incidents:</p>
            {openIncidents.slice(0, 3).map((incident) => (
              <div key={incident.incident_id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getSeverityColor(incident.severity)}`} />
                  <span className="font-mono">{incident.item_code}</span>
                  <span className="text-muted-foreground">
                    {getIncidentTypeLabel(incident.incident_type)}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {incident.days_since_reported}d
                </Badge>
              </div>
            ))}
            {openIncidents.length > 3 && (
              <p className="text-xs text-gray-500">
                and {openIncidents.length - 3} more...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};