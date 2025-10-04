import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { VehicleSummaryData } from '@/hooks/vehicle/useVehicleSummary';

interface VehicleStockSummaryProps {
  summary: VehicleSummaryData['stock'] | undefined;
  vehicleId: string;
  licensePlate: string;
}

export function VehicleStockSummary({ 
  summary, 
  vehicleId, 
  licensePlate 
}: VehicleStockSummaryProps) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>
          Vehicle Stock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Stats */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Today's Load:</span>
            <span className="font-semibold">
              {summary?.todays_load ?? 0} units assigned
            </span>
          </div>

          {(summary?.todays_load ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground pt-2">
              No inventory loaded on {licensePlate} today
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/fleet/truck-stock?vehicle=${vehicleId}`)}
          >
            Manage Stock
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
