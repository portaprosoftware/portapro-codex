import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';
import { EnhancedSpillKitCheckForm } from './EnhancedSpillKitCheckForm';
import { CheckCircle, AlertTriangle, Plus, History, WifiOff, Wifi, Cloud } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useSpillKitOffline } from '@/hooks/useSpillKitOffline';
import { format } from 'date-fns';

export function DriverSpillKitCheck() {
  const { userId } = useUserRole();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { 
    isOnline, 
    offlineQueue, 
    isSyncing, 
    pendingCount, 
    syncedCount,
    processOfflineQueue,
    clearSyncedChecks 
  } = useSpillKitOffline();

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

      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <>
                  <Wifi className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold">Online</p>
                    <p className="text-sm text-muted-foreground">All checks will sync immediately</p>
                  </div>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-semibold">Offline Mode</p>
                    <p className="text-sm text-muted-foreground">Checks saved locally, will sync when online</p>
                  </div>
                </>
              )}
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0">
                  {pendingCount} Pending
                </Badge>
                {isOnline && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => processOfflineQueue()}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <>
                        <Cloud className="h-4 w-4 mr-2 animate-pulse" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Cloud className="h-4 w-4 mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Cards */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Driver interface for quick spill kit inspections. Click "New Check" to perform an inspection. Works offline!
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

      {/* Offline Queue */}
      {offlineQueue.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Offline Queue</CardTitle>
                <CardDescription>Checks waiting to sync</CardDescription>
              </div>
              {syncedCount > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={clearSyncedChecks}
                >
                  Clear Synced ({syncedCount})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {offlineQueue.slice(0, 5).map((check) => (
                <div 
                  key={check.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">Vehicle Check</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(check.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <Badge 
                    className={
                      check.status === 'synced' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0'
                        : check.status === 'syncing'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0'
                        : check.status === 'error'
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0'
                    }
                  >
                    {check.status === 'synced' && 'Synced'}
                    {check.status === 'syncing' && 'Syncing...'}
                    {check.status === 'error' && 'Error'}
                    {check.status === 'pending' && 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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