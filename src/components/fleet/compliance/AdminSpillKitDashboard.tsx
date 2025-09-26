import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedComponent } from '@/components/shared/ProtectedComponent';
import { SpillKitTemplateManager } from './SpillKitTemplateManager';
import { SpillKitComplianceReports } from './SpillKitComplianceReports';
import { SpillKitNotificationManager } from './SpillKitNotificationManager';
import { RestockRequestManager } from './RestockRequestManager';
import { EnhancedSpillKitCheckForm } from './EnhancedSpillKitCheckForm';
import { Button } from '@/components/ui/button';
import { Plus, Settings, FileText, Bell, Package } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

export function AdminSpillKitDashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleSaved = () => {
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Spill Kit Compliance</h2>
          <p className="text-muted-foreground">Manage templates, reports, and compliance monitoring</p>
        </div>
        <ProtectedComponent requiredPermission="canPerformSpillKitChecks">
          <Button onClick={() => setDrawerOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Inspection
          </Button>
        </ProtectedComponent>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <ProtectedComponent requiredPermission="canManageSpillKitTemplates" fallback={null} showError={false}>
            <TabsTrigger value="templates">
              <Settings className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </ProtectedComponent>
          <ProtectedComponent requiredPermission="canViewSpillKitReports" fallback={null} showError={false}>
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </ProtectedComponent>
          <ProtectedComponent requiredPermission="canManageSpillKitNotifications" fallback={null} showError={false}>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
          </ProtectedComponent>
          <ProtectedComponent requiredPermission="canManageSpillKitRestock" fallback={null} showError={false}>
            <TabsTrigger value="restock">
              <Package className="h-4 w-4 mr-2" />
              Restock
            </TabsTrigger>
          </ProtectedComponent>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Overview</CardTitle>
              <CardDescription>
                Monitor spill kit compliance across your fleet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Overview dashboard will be implemented here with compliance statistics and alerts.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <ProtectedComponent requiredPermission="canManageSpillKitTemplates">
            <SpillKitTemplateManager />
          </ProtectedComponent>
        </TabsContent>

        <TabsContent value="reports">
          <ProtectedComponent requiredPermission="canViewSpillKitReports">
            <SpillKitComplianceReports />
          </ProtectedComponent>
        </TabsContent>

        <TabsContent value="notifications">
          <ProtectedComponent requiredPermission="canManageSpillKitNotifications">
            <SpillKitNotificationManager />
          </ProtectedComponent>
        </TabsContent>

        <TabsContent value="restock">
          <ProtectedComponent requiredPermission="canManageSpillKitRestock">
            <RestockRequestManager />
          </ProtectedComponent>
        </TabsContent>
      </Tabs>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Spill Kit Inspection</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            <EnhancedSpillKitCheckForm onSaved={handleSaved} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}