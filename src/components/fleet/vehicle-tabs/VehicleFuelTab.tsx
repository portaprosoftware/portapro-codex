import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVehicleFuelLogs } from '@/hooks/vehicle/useVehicleFuelLogs';
import { Fuel, Plus, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface VehicleFuelTabProps {
  vehicleId: string;
  licensePlate: string;
  onAddFuelLog?: () => void;
}

export function VehicleFuelTab({ vehicleId, licensePlate, onAddFuelLog }: VehicleFuelTabProps) {
  const navigate = useNavigate();
  const { data: fuelLogs, isLoading } = useVehicleFuelLogs({
    vehicleId,
    limit: 10,
  });

  const calculateStats = () => {
    if (!fuelLogs || fuelLogs.items.length === 0) return null;
    
    const totalGallons = fuelLogs.items.reduce((sum: number, log: any) => sum + (log.fuel_amount || 0), 0);
    const totalCost = fuelLogs.items.reduce((sum: number, log: any) => sum + (log.total_cost || 0), 0);
    const avgMPG = fuelLogs.items.reduce((sum: number, log: any) => sum + (log.mpg || 0), 0) / fuelLogs.items.length;

    return {
      totalGallons: totalGallons.toFixed(1),
      totalCost: totalCost.toFixed(2),
      avgMPG: avgMPG.toFixed(1),
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Gallons</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalGallons}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold text-green-600">${stats.totalCost}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg MPG</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.avgMPG}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fuel Logs List */}
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Fuel className="w-5 h-5" />
            Fuel Logs ({fuelLogs?.total || 0})
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={onAddFuelLog}>
              <Plus className="w-4 h-4 mr-1" />
              Log Fuel
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/fleet/fuel?vehicle_id=${vehicleId}&vehicle_name=${encodeURIComponent(licensePlate)}`)}
              title="View all fuel logs"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : fuelLogs && fuelLogs.items.length > 0 ? (
            <div className="space-y-3">
              {fuelLogs.items.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-sm">
                        {log.fuel_amount} gal @ ${log.price_per_gallon}/gal
                      </p>
                      <p className="text-sm text-green-600 font-bold">
                        ${log.total_cost?.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.fuel_date), 'MMM d, yyyy')} • Odometer: {log.odometer?.toLocaleString()} mi
                      {log.mpg && ` • MPG: ${log.mpg.toFixed(1)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Fuel className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No fuel logs yet</p>
              <Button size="sm" onClick={onAddFuelLog}>
                <Plus className="w-4 h-4 mr-1" />
                Log First Fuel Entry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
