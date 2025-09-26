import React, { useState } from 'react';
import { useDriverVehicleAssignments } from '@/hooks/useDriverVehicleAssignments';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { 
  Truck, 
  FileText, 
  Calendar, 
  MapPin, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export const DriverVehiclesPage: React.FC = () => {
  const { user } = useUserRole();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: assignments = [], isLoading, error, refetch } = useDriverVehicleAssignments(selectedDate);

  const handleRefresh = async () => {
    await refetch();
  };

  if (!user) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please log in to view your vehicle assignments.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load vehicle assignments. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Truck className="h-6 w-6" />
              My Vehicles
            </h1>
          </div>

          {/* Date Selection */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded-md px-3 py-2 bg-background text-foreground"
            />
          </div>
        </div>

        {/* Vehicle Assignments */}
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No vehicles assigned</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any vehicles assigned for {format(new Date(selectedDate), 'MMMM d, yyyy')}.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const vehicle = assignment.vehicles;
              if (!vehicle) return null;

              return (
                <Card key={assignment.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                          <Truck className="h-5 w-5 text-blue-600" />
                        </div>
                        {vehicle.license_plate || `Vehicle ${vehicle.id.slice(0, 8)}`}
                      </CardTitle>
                      <Badge 
                        variant={vehicle.status === 'active' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {vehicle.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Vehicle Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Make/Model:</span>
                        <p className="font-medium">
                          {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ') || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <p className="font-medium">{vehicle.vehicle_type || 'Standard'}</p>
                      </div>
                      {assignment.start_mileage && (
                        <div>
                          <span className="text-muted-foreground">Start Mileage:</span>
                          <p className="font-medium">{assignment.start_mileage.toLocaleString()} mi</p>
                        </div>
                      )}
                    </div>

                    {/* Assignment Details */}
                    <div className="bg-muted/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        Assignment Details
                      </div>
                      <div className="text-sm">
                        <p>Date: {format(new Date(assignment.assignment_date), 'MMMM d, yyyy')}</p>
                        {assignment.notes && (
                          <p className="mt-1 text-muted-foreground">{assignment.notes}</p>
                        )}
                      </div>
                    </div>

                    {/* DVIR Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => navigate(`/driver/vehicles/${vehicle.id}/dvir/new?type=pre_trip`)}
                        size="sm"
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Pre-Trip DVIR
                      </Button>
                      <Button
                        onClick={() => navigate(`/driver/vehicles/${vehicle.id}/dvir/new?type=post_trip`)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Post-Trip DVIR
                      </Button>
                    </div>

                    {/* View DVIR History */}
                    <Button
                      onClick={() => navigate(`/driver/vehicles/${vehicle.id}/dvir`)}
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View DVIR History
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
};