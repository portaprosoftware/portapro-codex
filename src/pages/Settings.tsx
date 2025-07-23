
import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Building2, Users, Bell, DollarSign, Clock, Calendar } from "lucide-react";
import { SimplifiedSettings } from "@/components/settings/SimplifiedSettings";
import { DriverWorkingHoursSection } from "@/components/settings/DriverWorkingHoursSection";
import { DriverTimeOffSection } from "@/components/settings/DriverTimeOffSection";
import { useUserRole } from "@/hooks/useUserRole";

type SettingsSection = 'overview' | 'driver-hours' | 'driver-timeoff';

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
      default:
        return (
          <div className="space-y-6">
            <SimplifiedSettings />
            
            {/* Driver Management Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Driver Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSection('driver-hours')}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <CardTitle className="text-lg">Driver Working Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Manage driver schedules and working hours</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSection('driver-timeoff')}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <CardTitle className="text-lg">Time Off Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Review and manage driver time-off requests</p>
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
