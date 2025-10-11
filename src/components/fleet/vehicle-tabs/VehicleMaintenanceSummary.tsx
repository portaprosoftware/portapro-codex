import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, ExternalLink, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MaintenanceRecordCard } from '@/components/fleet/maintenance/MaintenanceRecordCard';

interface VehicleMaintenanceSummaryProps {
  vehicleId: string;
  licensePlate: string;
}

export function VehicleMaintenanceSummary({ 
  vehicleId, 
  licensePlate 
}: VehicleMaintenanceSummaryProps) {
  const navigate = useNavigate();

  // Fetch maintenance records with proper joins
  const { data: maintenanceRecords, isLoading } = useQuery({
    queryKey: ['vehicle-maintenance-summary', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select(`
          *,
          vehicles(license_plate, vehicle_type, make, model, nickname),
          maintenance_task_types(name),
          maintenance_vendors(name)
        `)
        .eq('vehicle_id', vehicleId)
        .order('scheduled_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!vehicleId
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-blue-600" />
          Maintenance Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : maintenanceRecords && maintenanceRecords.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Vehicle</TableHead>
                  <TableHead className="text-left">Task & Details</TableHead>
                  <TableHead className="text-center">Vendor</TableHead>
                  <TableHead className="text-left">Dates</TableHead>
                  <TableHead className="text-left">Status</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <MaintenanceRecordCard
                      record={record}
                      variant="table"
                      onView={(rec) => navigate(`/fleet/maintenance?tab=all-records&vehicle=${vehicleId}&returnTo=/fleet-management`)}
                    />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No maintenance records found</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/fleet/maintenance?tab=all-records&vehicle=${vehicleId}&returnTo=/fleet-management`)}
          >
            View All <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/fleet/maintenance?tab=work-orders&vehicle=${vehicleId}&returnTo=/fleet-management`)}
          >
            <Plus className="w-3 h-3 mr-1" /> New Work Order
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
