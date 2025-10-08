import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFuelTankAlerts, useAcknowledgeAlert } from '@/hooks/useFuelTankAlerts';
import { TankAlertBadge } from './TankAlertBadge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export const FuelTankAlerts: React.FC = () => {
  const { data: alerts, isLoading } = useFuelTankAlerts();
  const acknowledgeAlert = useAcknowledgeAlert();

  if (isLoading) return null;
  
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert.mutate(alertId);
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          Attention Needed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start justify-between p-3 bg-white rounded-lg border"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <TankAlertBadge severity={alert.severity} />
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(alert.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAcknowledge(alert.id)}
              className="ml-2"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Acknowledge
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
