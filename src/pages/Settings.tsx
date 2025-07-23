
import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Building2, Users, Bell, DollarSign, Clock, Calendar } from "lucide-react";
import { DriverWorkingHoursSection } from "@/components/settings/DriverWorkingHoursSection";
import { DriverTimeOffSection } from "@/components/settings/DriverTimeOffSection";
import { QRFeedbackSection } from "@/components/settings/QRFeedbackSection";
import { BusinessHoursSection } from "@/components/settings/BusinessHoursSection";
import { useUserRole } from "@/hooks/useUserRole";

type SettingsSection = 'overview' | 'driver-hours' | 'driver-timeoff' | 'qr-feedback' | 'business-hours';

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('overview');
  const { hasAdminAccess } = useUserRole();

  if (!hasAdminAccess) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access settings.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'driver-hours':
        return <DriverWorkingHoursSection onBack={() => setActiveSection('overview')} />;
      case 'driver-timeoff':
        return <DriverTimeOffSection onBack={() => setActiveSection('overview')} />;
      case 'qr-feedback':
        return <QRFeedbackSection />;
      case 'business-hours':
        return <BusinessHoursSection />;
      default:
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                <SettingsIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 font-inter">Settings</h1>
                <p className="text-gray-600 font-inter">Manage your company settings and preferences</p>
              </div>
            </div>

            {/* Main Settings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="font-inter">Active</Badge>
                  </div>
                  <CardTitle className="text-lg font-inter text-gray-900">Company Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 font-inter">Company information and configuration</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSection('business-hours')}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="font-inter">Configured</Badge>
                  </div>
                  <CardTitle className="text-lg font-inter text-gray-900">Business Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 font-inter">Operating hours and schedules</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="font-inter">3 Users</Badge>
                  </div>
                  <CardTitle className="text-lg font-inter text-gray-900">User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 font-inter">Users, roles and permissions</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="font-inter">Enabled</Badge>
                  </div>
                  <CardTitle className="text-lg font-inter text-gray-900">Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 font-inter">Alert preferences and settings</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="font-inter">2 Rules</Badge>
                  </div>
                  <CardTitle className="text-lg font-inter text-gray-900">Pricing Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 font-inter">Discount and pricing management</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Driver Management Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 font-inter">Driver Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSection('driver-hours')}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="font-inter">Active</Badge>
                    </div>
                    <CardTitle className="text-lg font-inter text-gray-900">Driver Working Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 font-inter">Manage driver schedules and working hours</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSection('driver-timeoff')}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="font-inter">Active</Badge>
                    </div>
                    <CardTitle className="text-lg font-inter text-gray-900">Time Off Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 font-inter">Review and manage driver time-off requests</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSection('qr-feedback')}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                        <Bell className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="font-inter">Active</Badge>
                    </div>
                    <CardTitle className="text-lg font-inter text-gray-900">QR Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 font-inter">Configure QR code feedback notifications and settings</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Layout>
      {renderSection()}
    </Layout>
  );
}
