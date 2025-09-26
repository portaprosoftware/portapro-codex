import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserRole } from '@/hooks/useUserRole';
import { EnhancedSpillKitCheckForm } from './EnhancedSpillKitCheckForm';
import { CheckCircle, AlertTriangle, Plus, History } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

export function DriverSpillKitCheck() {
  const { userId } = useUserRole();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleSaved = () => {
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Spill Kit Check</h2>
          <p className="text-muted-foreground">Perform quick spill kit inspections</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setHistoryOpen(true)}>
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button onClick={() => setDrawerOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Check
          </Button>
        </div>
      </div>

      {/* Alert Cards */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Driver interface for quick spill kit inspections. Click "New Check" to perform an inspection.
        </AlertDescription>
      </Alert>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Recent Checks</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Needs Attention</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Complete Kits</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Your Recent Checks</CardTitle>
          <CardDescription>Last 5 spill kit inspections you performed</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent checks found. Start your first inspection above.</p>
        </CardContent>
      </Card>

      {/* Inspection Form Drawer */}
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

      {/* History Drawer */}
      <Drawer open={historyOpen} onOpenChange={setHistoryOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Check History</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            <div className="space-y-4">
              <p className="text-muted-foreground">History will be populated as you perform inspections.</p>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}