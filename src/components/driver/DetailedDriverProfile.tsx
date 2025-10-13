import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DriverCredentialsSection } from './DriverCredentialsSection';
import { DriverTrainingSection } from './DriverTrainingSection';
import { DriverComplianceStatus } from './DriverComplianceStatus';
import { DriverDocumentManagement } from './DriverDocumentManagement';
import { EditDriverProfileDialog } from './EditDriverProfileDialog';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Edit, User, Shield, GraduationCap, 
  FileText, Phone, Mail, Calendar, Clock, MapPin 
} from 'lucide-react';

export function DetailedDriverProfile() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: driver, isLoading } = useQuery({
    queryKey: ['driver-detail', driverId],
    queryFn: async () => {
      if (!driverId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role),
          driver_credentials(*),
          driver_training_records(*),
          driver_devices(*),
          driver_ppe_info(*)
        `)
        .eq('id', driverId)
        .eq('user_roles.role', 'driver')
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!driverId
  });

  // Fetch working hours separately to avoid foreign key issues
  const { data: workingHours } = useQuery({
    queryKey: ['driver-working-hours', driverId],
    queryFn: async () => {
      if (!driverId) return [];
      
      const { data, error } = await supabase
        .from('driver_working_hours')
        .select('*')
        .eq('driver_id', driverId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!driverId
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Driver Not Found</h2>
        <p className="text-gray-600 mb-4">The requested driver profile could not be found.</p>
        <Button variant="primary" onClick={() => navigate('/team-management/users')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Team Management
        </Button>
      </div>
    );
  }

  const initials = `${driver.first_name?.[0] || ''}${driver.last_name?.[0] || ''}`;
  
  // Calculate compliance status
  const credentials = driver.driver_credentials?.[0];
  const isLicenseExpiring = credentials?.license_expiry_date && 
    new Date(credentials.license_expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const isMedicalExpiring = credentials?.medical_card_expiry_date && 
    new Date(credentials.medical_card_expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <Card className="rounded-2xl shadow-md">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => navigate('/team-management/users')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Team Management
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Driver Overview Card */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-start space-x-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={driver.profile_photo || undefined} />
                <AvatarFallback className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      {driver.first_name} {driver.last_name}
                    </h1>
                    <p className="text-gray-600">{driver.email}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold">
                      <User className="w-3 h-3 mr-1" />
                      Driver
                    </Badge>
                    <Badge variant={driver.is_active ? "default" : "secondary"}>
                      {driver.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {(isLicenseExpiring || isMedicalExpiring) && (
                      <Badge variant="destructive">
                        <Shield className="w-3 h-3 mr-1" />
                        Attention Required
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {driver.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {driver.phone}
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {driver.email}
                  </div>
                  {driver.hire_date && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Hired {new Date(driver.hire_date).toLocaleDateString()}
                    </div>
                  )}
                  {driver.driver_devices?.[0]?.app_last_login && (
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      Last active {new Date(driver.driver_devices[0].app_last_login).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">License Status</span>
                    <Badge variant={credentials?.license_expiry_date && new Date(credentials.license_expiry_date) > new Date() ? "default" : "destructive"}>
                      {credentials?.license_expiry_date ? 
                        new Date(credentials.license_expiry_date) > new Date() ? "Valid" : "Expired"
                        : "Not Set"
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Medical Card</span>
                    <Badge variant={credentials?.medical_card_expiry_date && new Date(credentials.medical_card_expiry_date) > new Date() ? "default" : "destructive"}>
                      {credentials?.medical_card_expiry_date ? 
                        new Date(credentials.medical_card_expiry_date) > new Date() ? "Valid" : "Expired"
                        : "Not Set"
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Training Records</span>
                    <Badge variant="secondary">
                      {driver.driver_training_records?.length || 0} Records
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Working Days</span>
                    <Badge variant="secondary">
                      {Array.isArray(workingHours) ? workingHours.filter(h => h.is_active)?.length || 0 : 0} Days/Week
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {driver.driver_devices?.[0]?.app_last_login ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Last app login: {new Date(driver.driver_devices[0].app_last_login).toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span>No recent app activity</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Profile created: {new Date(driver.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    {driver.updated_at !== driver.created_at && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Last updated: {new Date(driver.updated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="credentials">
            <DriverCredentialsSection driverId={driverId!} />
          </TabsContent>
          
          <TabsContent value="training">
            <DriverTrainingSection driverId={driverId!} />
          </TabsContent>
          
          <TabsContent value="compliance">
            <DriverComplianceStatus driverId={driverId!} />
          </TabsContent>
          
          <TabsContent value="documents">
            <DriverDocumentManagement driverId={driverId!} />
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <EditDriverProfileDialog 
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          driver={driver}
        />
      </CardContent>
    </Card>
  );
}