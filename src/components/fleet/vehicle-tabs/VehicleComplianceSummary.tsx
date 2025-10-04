import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ExternalLink, Plus, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { VehicleSummaryData } from '@/hooks/vehicle/useVehicleSummary';

interface VehicleComplianceSummaryProps {
  summary: VehicleSummaryData['compliance'] | undefined;
  vehicleId: string;
  licensePlate: string;
}

export function VehicleComplianceSummary({ 
  summary, 
  vehicleId, 
  licensePlate 
}: VehicleComplianceSummaryProps) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-purple-600" />
          Compliance Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Stats */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground">Spill Kit:</span>
            <div className="flex items-center gap-2">
              {summary?.spill_kit_status === 'compliant' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                    Compliant
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-600" />
                  <Badge variant="destructive">Missing</Badge>
                </>
              )}
            </div>
          </div>

          {summary?.last_kit_check && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Check:</span>
              <span className="font-semibold">
                {formatDistanceToNow(new Date(summary.last_kit_check), { addSuffix: true })}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Incidents (30d):</span>
            <span className={`font-semibold ${(summary?.incidents_30d ?? 0) > 0 ? 'text-red-600' : ''}`}>
              {summary?.incidents_30d ?? 0}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Decon Logs (30d):</span>
            <span className="font-semibold">{summary?.decon_logs_30d ?? 0}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/fleet/compliance?vehicle=${vehicleId}`)}
          >
            View All <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/fleet/compliance?action=new-incident&vehicle=${vehicleId}`)}
          >
            <Plus className="w-3 h-3 mr-1" /> Log Incident
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
