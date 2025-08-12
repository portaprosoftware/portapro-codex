import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DocumentUpload } from './DocumentUpload';
import { 
  User, 
  FileText, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Upload,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MobileDriverViewProps {
  driverId?: string;
}

export function MobileDriverView({ driverId }: MobileDriverViewProps) {
  const { userId } = useAuth();
  const currentDriverId = driverId || userId;
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState<'license' | 'medical' | 'training'>('license');
  const { toast } = useToast();

  // Fetch driver profile
  const { data: driver, isLoading: profileLoading } = useQuery({
    queryKey: ['driver-profile', currentDriverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentDriverId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentDriverId
  });

  // Fetch driver credentials
  const { data: credentials, isLoading: credentialsLoading } = useQuery({
    queryKey: ['driver-credentials', currentDriverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_credentials')
        .select('*')
        .eq('driver_id', currentDriverId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    enabled: !!currentDriverId
  });

  // Fetch training records
  const { data: trainings = [], isLoading: trainingsLoading } = useQuery({
    queryKey: ['driver-trainings', currentDriverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_training_records')
        .select('*')
        .eq('driver_id', currentDriverId)
        .order('last_completed', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentDriverId
  });

  const getExpirationStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { status: 'missing', label: 'Missing', color: 'destructive' as const };
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', label: 'Expired', color: 'destructive' as const };
    if (daysUntilExpiry <= 30) return { status: 'expiring', label: 'Expiring Soon', color: 'destructive' as const };
    if (daysUntilExpiry <= 60) return { status: 'warning', label: 'Expires in 60 days', color: 'outline' as const };
    return { status: 'current', label: 'Current', color: 'default' as const };
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    toast({
      title: "Document Uploaded",
      description: "Your document has been uploaded successfully and is being reviewed."
    });
  };

  if (profileLoading || credentialsLoading || trainingsLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const licenseStatus = getExpirationStatus(credentials?.license_expiry_date);
  const medicalStatus = getExpirationStatus(credentials?.medical_card_expiry_date);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback>
              {driver?.first_name?.[0]}{driver?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {driver?.first_name} {driver?.last_name}
            </h1>
            <p className="text-primary-foreground/80">Driver Portal</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Alert Cards */}
            <div className="space-y-3">
              {licenseStatus.status === 'expired' || licenseStatus.status === 'expiring' ? (
                <Card className="border-destructive bg-destructive/5">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <div className="flex-1">
                        <p className="font-medium text-destructive">License Action Required</p>
                        <p className="text-sm text-muted-foreground">
                          Your driver's license {licenseStatus.status === 'expired' ? 'has expired' : 'expires soon'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {medicalStatus.status === 'expired' || medicalStatus.status === 'expiring' ? (
                <Card className="border-destructive bg-destructive/5">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <div className="flex-1">
                        <p className="font-medium text-destructive">Medical Card Action Required</p>
                        <p className="text-sm text-muted-foreground">
                          Your medical card {medicalStatus.status === 'expired' ? 'has expired' : 'expires soon'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {driver?.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{driver.email}</span>
                  </div>
                )}
                {driver?.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{driver.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Driver License</span>
                  <Badge variant={licenseStatus.color}>
                    {licenseStatus.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Medical Card</span>
                  <Badge variant={medicalStatus.color}>
                    {medicalStatus.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Training Records</span>
                  <Badge variant={trainings.length > 0 ? 'default' : 'outline'}>
                    {trainings.length} Complete
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {/* Document Upload Actions */}
            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => {
                  setUploadType('license');
                  setShowUpload(true);
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload License Document
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => {
                  setUploadType('medical');
                  setShowUpload(true);
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Medical Card
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => {
                  setUploadType('training');
                  setShowUpload(true);
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Training Certificate
              </Button>
            </div>

            {/* Current Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Current Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* License */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">Driver License</p>
                    <p className="text-sm text-muted-foreground">
                      {credentials?.license_number || 'Not provided'}
                    </p>
                    {credentials?.license_expiry_date && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {format(new Date(credentials.license_expiry_date), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                  <Badge variant={licenseStatus.color}>
                    {licenseStatus.label}
                  </Badge>
                </div>

                {/* Medical Card */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">Medical Card</p>
                    <p className="text-sm text-muted-foreground">
                      {credentials?.medical_card_reference || 'Not provided'}
                    </p>
                    {credentials?.medical_card_expiry_date && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {format(new Date(credentials.medical_card_expiry_date), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                  <Badge variant={medicalStatus.color}>
                    {medicalStatus.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Training Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trainings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No training records found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trainings.map((training, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{training.training_type}</p>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        {training.last_completed && (
                          <p className="text-sm text-muted-foreground">
                            Completed: {format(new Date(training.last_completed), 'MMM dd, yyyy')}
                          </p>
                        )}
                        {training.next_due && (
                          <p className="text-sm text-muted-foreground">
                            Next Due: {format(new Date(training.next_due), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-background p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Upload {uploadType}</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowUpload(false)}
            >
              Cancel
            </Button>
          </div>
          <DocumentUpload
            driverId={currentDriverId!}
            documentType={uploadType === 'license' ? 'license' : uploadType === 'medical' ? 'medical_card' : 'training'}
            onUploadComplete={handleUploadSuccess}
            onUploadError={(error) => {
              toast({
                title: "Upload Failed",
                description: error,
                variant: "destructive"
              });
            }}
            maxFileSize={5}
            acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
          />
        </div>
      )}
    </div>
  );
}