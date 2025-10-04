import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fuel, ExternalLink, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { VehicleSummaryData } from '@/hooks/vehicle/useVehicleSummary';

interface VehicleFuelSummaryProps {
  summary: VehicleSummaryData['fuel'] | undefined;
  vehicleId: string;
  licensePlate: string;
}

export function VehicleFuelSummary({ 
  summary, 
  vehicleId, 
  licensePlate 
}: VehicleFuelSummaryProps) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5 text-orange-600" />
          Fuel Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Stats */}
        <div className="space-y-2">
          {summary?.last_fill_date && summary?.last_fill_gallons ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Fill:</span>
              <span className="font-semibold">
                {formatDistanceToNow(new Date(summary.last_fill_date), { addSuffix: true })} 
                {' '}({summary.last_fill_gallons} gal)
              </span>
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Fill:</span>
              <span className="font-semibold text-gray-500">No records</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Avg MPG (30d):</span>
            <span className="font-semibold">
              {summary?.avg_mpg_30d ? `${summary.avg_mpg_30d} MPG` : 'N/A'}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Spent (30d):</span>
            <span className="font-semibold">
              ${summary?.total_spent_30d?.toFixed(2) ?? '0.00'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/fleet/fuel?vehicle=${vehicleId}&returnTo=/fleet-management`)}
          >
            View History <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/fleet/fuel?action=log&vehicle=${vehicleId}&returnTo=/fleet-management`)}
          >
            <Plus className="w-3 h-3 mr-1" /> Log Fuel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
