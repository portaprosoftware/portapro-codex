import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedComponent } from '@/components/shared/ProtectedComponent';
import { SpillKitTemplateManager } from './SpillKitTemplateManager';
import { SpillKitComplianceReports } from './SpillKitComplianceReports';
import { SpillKitInspectionHistory } from './SpillKitInspectionHistory';
import { RestockRequestManager } from './RestockRequestManager';
import { SpillKitInventoryManager } from './SpillKitInventoryManager';
import { SpillKitInventoryDashboard } from './SpillKitInventoryDashboard';
import { EnhancedSpillKitInventoryManager } from './EnhancedSpillKitInventoryManager';
import { EnhancedSpillKitCheckForm } from './EnhancedSpillKitCheckForm';
import { Button } from '@/components/ui/button';
import { Plus, Settings, FileText, Package, History, Box } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

interface AdminSpillKitDashboardProps {
  inspectionDrawerOpen?: boolean;
  setInspectionDrawerOpen?: (open: boolean) => void;
}

export function AdminSpillKitDashboard({ 
  inspectionDrawerOpen: externalDrawerOpen, 
  setInspectionDrawerOpen: externalSetDrawerOpen 
}: AdminSpillKitDashboardProps) {
  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("history");
  
  const drawerOpen = externalDrawerOpen ?? internalDrawerOpen;
  const setDrawerOpen = externalSetDrawerOpen ?? setInternalDrawerOpen;

  const handleSaved = () => {
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Spill Kit Compliance</h2>
          <p className="text-muted-foreground">Manage templates, reports, and compliance monitoring</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <ProtectedComponent requiredPermission="canManageSpillKitTemplates" fallback={null} showError={false}>
            <TabsTrigger value="templates">
              <Settings className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </ProtectedComponent>
          <ProtectedComponent requiredPermission="canManageSpillKitRestock" fallback={null} showError={false}>
            <TabsTrigger value="dashboard">
              <Box className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
          </ProtectedComponent>
          <ProtectedComponent requiredPermission="canManageSpillKitRestock" fallback={null} showError={false}>
            <TabsTrigger value="inventory">
              <Package className="h-4 w-4 mr-2" />
              Inventory
            </TabsTrigger>
          </ProtectedComponent>
          <ProtectedComponent requiredPermission="canViewSpillKitReports" fallback={null} showError={false}>
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </ProtectedComponent>
          <ProtectedComponent requiredPermission="canManageSpillKitRestock" fallback={null} showError={false}>
            <TabsTrigger value="restock">
              <Package className="h-4 w-4 mr-2" />
              Restock
            </TabsTrigger>
          </ProtectedComponent>
        </TabsList>

        <TabsContent value="history">
          <SpillKitInspectionHistory />
        </TabsContent>

        <TabsContent value="templates">
          <ProtectedComponent requiredPermission="canManageSpillKitTemplates">
            <SpillKitTemplateManager />
          </ProtectedComponent>
        </TabsContent>

        <TabsContent value="dashboard">
          <ProtectedComponent requiredPermission="canManageSpillKitRestock">
            <SpillKitInventoryDashboard />
          </ProtectedComponent>
        </TabsContent>

        <TabsContent value="inventory">
          <ProtectedComponent requiredPermission="canManageSpillKitRestock">
            <EnhancedSpillKitInventoryManager />
          </ProtectedComponent>
        </TabsContent>

        <TabsContent value="reports">
          <ProtectedComponent requiredPermission="canViewSpillKitReports">
            <SpillKitComplianceReports />
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