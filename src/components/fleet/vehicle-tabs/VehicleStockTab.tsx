import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

interface VehicleStockTabProps {
  vehicleId: string;
  licensePlate: string;
}

export function VehicleStockTab({ vehicleId, licensePlate }: VehicleStockTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Truck Stock Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Manage inventory and stock loaded on {licensePlate}
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Stock management features coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
