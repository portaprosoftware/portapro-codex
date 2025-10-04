import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink, Shield, AlertTriangle, Droplet, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { VehicleSummaryData } from '@/hooks/vehicle/useVehicleSummary';

interface VehicleComplianceReportsTabProps {
  vehicleId: string;
  licensePlate: string;
}

export function VehicleComplianceReportsTab({ vehicleId, licensePlate }: VehicleComplianceReportsTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Compliance Overview</h3>
          <p className="text-sm text-gray-600">Summary reports for {licensePlate}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/fleet/compliance?tab=reports&vehicle=${vehicleId}&returnTo=/fleet-management`)}
          className="gap-2"
        >
          View Reports <ExternalLink className="w-3 h-3" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Quick Actions */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => navigate(`/fleet/compliance?tab=documents&vehicle=${vehicleId}&action=add&returnTo=/fleet-management`)}
              >
                <FileText className="w-4 h-4" />
                Add Document
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => navigate(`/fleet/compliance?tab=spill-kits&vehicle=${vehicleId}&action=new-check&returnTo=/fleet-management`)}
              >
                <Shield className="w-4 h-4" />
                Spill Kit Check
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => navigate(`/fleet/compliance?tab=incidents&vehicle=${vehicleId}&action=new-incident&returnTo=/fleet-management`)}
              >
                <AlertTriangle className="w-4 h-4" />
                Log Incident
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => navigate(`/fleet/compliance?tab=decon&vehicle=${vehicleId}&action=new-decon&returnTo=/fleet-management`)}
              >
                <Droplet className="w-4 h-4" />
                Record Decon
              </Button>
            </div>
          </div>

          {/* Compliance Status */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Compliance Status</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Spill Kit</span>
                </div>
                <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold">
                  View Status
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Documents</span>
                </div>
                <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold">
                  View All
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Incidents (30d)</span>
                </div>
                <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold">
                  View History
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Droplet className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Decon Logs (30d)</span>
                </div>
                <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold">
                  View Logs
                </Badge>
              </div>
            </div>
          </div>

          {/* Full Compliance Section Link */}
          <div className="pt-2 border-t">
            <Button
              onClick={() => navigate(`/fleet/compliance?vehicle=${vehicleId}&returnTo=/fleet-management`)}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold"
            >
              Open Full Compliance Section
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
