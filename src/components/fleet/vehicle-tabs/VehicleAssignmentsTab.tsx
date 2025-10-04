import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVehicleAssignments } from '@/hooks/vehicle/useVehicleAssignments';
import { Calendar, Plus, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface VehicleAssignmentsTabProps {
  vehicleId: string;
  licensePlate: string;
  onAddAssignment?: () => void;
  isActive?: boolean;
}

export function VehicleAssignmentsTab({ 
  vehicleId, 
  licensePlate,
  onAddAssignment,
  isActive = true
}: VehicleAssignmentsTabProps) {
  const navigate = useNavigate();
  const { data: assignments, isLoading } = useVehicleAssignments({
    vehicleId,
    limit: 10,
    enabled: isActive,
  });

  const handleNavigateToAssignments = () => {
    navigate(`/fleet/assignments?vehicle_id=${vehicleId}&vehicle_name=${encodeURIComponent(licensePlate)}`);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'completed':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'cancelled':
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
      default:
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Vehicle Assignments ({assignments?.total || 0})
          </CardTitle>
          <Button size="sm" onClick={handleNavigateToAssignments}>
            <Plus className="w-4 h-4 mr-1" />
            New Assignment
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : assignments && assignments.items.length > 0 ? (
            <div className="space-y-3">
              {assignments.items.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-600" />
                      <p className="font-medium text-sm">
                        Driver Assignment
                      </p>
                      {assignment.status && (
                        <Badge className={cn("text-white font-bold", getStatusColor(assignment.status))}>
                          {assignment.status.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Start: {format(new Date(assignment.assignment_date), 'MMM d, yyyy')}
                      </span>
                      {assignment.return_date && (
                        <span>
                          End: {format(new Date(assignment.return_date), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                    {assignment.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{assignment.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No assignments yet</p>
              <Button size="sm" onClick={handleNavigateToAssignments}>
                <Plus className="w-4 h-4 mr-1" />
                Create First Assignment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
