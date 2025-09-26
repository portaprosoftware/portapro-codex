import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { DVIRForm } from '@/components/fleet/DVIRForm';
import { useDriverDVIRs } from '@/hooks/useDriverDVIRs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, FileText, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const DriverDVIRPage: React.FC = () => {
  const { vehicleId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const type = searchParams.get('type') as 'pre_trip' | 'post_trip' | null;
  const [showDVIRForm, setShowDVIRForm] = useState(!!type);
  
  const { data: dvirs = [], isLoading, error } = useDriverDVIRs(vehicleId);

  // Auto-open DVIR form if type is specified
  useEffect(() => {
    if (type) {
      setShowDVIRForm(true);
    }
  }, [type]);

  const handleDVIRFormClose = (wasSubmitted?: boolean) => {
    setShowDVIRForm(false);
    if (wasSubmitted) {
      // Remove type param and stay on history page
      navigate(`/driver/vehicles/${vehicleId}/dvir`, { replace: true });
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please log in to view DVIR reports.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'default';
      case 'pending':
        return 'secondary';
      default:
        return 'destructive';
    }
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/driver/vehicles')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vehicles
          </Button>
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6" />
            DVIR Reports
          </h1>

          {!type && (
            <div className="flex gap-2">
              <Button
                onClick={() => setShowDVIRForm(true)}
                size="sm"
              >
                Create New DVIR
              </Button>
            </div>
          )}
        </div>

        {/* DVIR History */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load DVIR reports. Please try again.
            </AlertDescription>
          </Alert>
        ) : dvirs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No DVIR reports</h3>
              <p className="text-muted-foreground mb-4">
                You haven't created any DVIR reports for this vehicle yet.
              </p>
              <Button onClick={() => setShowDVIRForm(true)}>
                Create First DVIR
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {dvirs.map((dvir) => (
              <Card key={dvir.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {getStatusIcon(dvir.status)}
                      {dvir.type === 'pre_trip' ? 'Pre-Trip' : 'Post-Trip'} Inspection
                    </CardTitle>
                    <Badge variant={getStatusColor(dvir.status)}>
                      {dvir.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <p className="font-medium">
                        {format(new Date(dvir.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vehicle:</span>
                      <p className="font-medium">
                        Vehicle {dvir.asset_id.slice(0, 8)}
                      </p>
                    </div>
                    {dvir.odometer_miles && (
                      <div>
                        <span className="text-muted-foreground">Odometer:</span>
                        <p className="font-medium">{dvir.odometer_miles.toLocaleString()} mi</p>
                      </div>
                    )}
                    {dvir.defects_count > 0 && (
                      <div>
                        <span className="text-muted-foreground">Defects:</span>
                        <p className="font-medium text-red-600">
                          {dvir.defects_count} defect{dvir.defects_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>

                  {dvir.major_defect_present && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Major defects found - Vehicle may be out of service
                      </AlertDescription>
                    </Alert>
                  )}

                  {dvir.dvir_defects && dvir.dvir_defects.length > 0 && (
                    <div className="bg-muted/20 rounded-lg p-3">
                      <h4 className="font-medium text-sm mb-2">Open Defects:</h4>
                      <div className="space-y-1">
                        {dvir.dvir_defects.map((defect) => (
                          <div key={defect.id} className="text-sm flex items-center gap-2">
                            <Badge variant="outline">
                              {defect.severity}
                            </Badge>
                            <span>{defect.item_key.replace(/_/g, ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* DVIR Form Modal */}
      <DVIRForm
        open={showDVIRForm}
        onOpenChange={handleDVIRFormClose}
        preSelectedVehicleId={vehicleId}
        preSelectedDriverId={user?.id}
        preSelectedType={type || undefined}
      />
    </>
  );
};