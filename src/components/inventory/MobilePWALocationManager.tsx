import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StorageLocationSelector } from '@/components/inventory/StorageLocationSelector';
import { ConsumableRequestModal } from '@/components/inventory/ConsumableRequestModal';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useGeolocation } from '@/hooks/useGeolocation';
import { 
  Smartphone, 
  MapPin, 
  Wifi, 
  WifiOff, 
  Download,
  Bell,
  Package,
  Navigation,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface LocationAwareOperation {
  id: string;
  type: 'stock_check' | 'transfer_request' | 'reorder_alert' | 'job_assignment';
  title: string;
  description: string;
  location_id: string;
  location_name: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  requires_action: boolean;
}

export const MobilePWALocationManager: React.FC = () => {
  const [currentLocationId, setCurrentLocationId] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<LocationAwareOperation | null>(null);

  const { latitude, longitude, error: locationError, getCurrentPosition } = useGeolocation();
  const { 
    isSupported: notificationsSupported, 
    permission: notificationPermission
  } = usePushNotifications();

  const location = latitude && longitude ? { latitude, longitude } : null;

  // Detect nearest storage location based on GPS
  const { data: nearestLocation } = useQuery({
    queryKey: ['nearest-location', location?.latitude, location?.longitude],
    queryFn: async () => {
      if (!location) return null;

      const { data: locations, error } = await supabase
        .from('storage_locations')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Simple distance calculation (in real app would use proper geospatial queries)
      let nearest = null;
      let minDistance = Infinity;

      locations?.forEach(loc => {
        if (loc.gps_coordinates) {
          const distance = Math.sqrt(
            Math.pow((loc.gps_coordinates as any).x - location.longitude, 2) +
            Math.pow((loc.gps_coordinates as any).y - location.latitude, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearest = loc;
          }
        }
      });

      return nearest;
    },
    enabled: !!(location?.latitude && location?.longitude)
  });

  // Location-aware operations/tasks
  const { data: locationOperations, refetch: refetchOperations } = useQuery({
    queryKey: ['location-operations', currentLocationId],
    queryFn: async () => {
      // Simulate location-aware operations
      const mockOperations: LocationAwareOperation[] = [
        {
          id: '1',
          type: 'stock_check',
          title: 'Daily Stock Count',
          description: 'Perform daily inventory count for cleaning supplies',
          location_id: currentLocationId,
          location_name: nearestLocation?.name || 'Current Location',
          priority: 'medium',
          created_at: new Date().toISOString(),
          requires_action: true
        },
        {
          id: '2',
          type: 'reorder_alert',
          title: 'Low Stock Alert',
          description: 'Toilet paper is running low (5 rolls remaining)',
          location_id: currentLocationId,
          location_name: nearestLocation?.name || 'Current Location',
          priority: 'high',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
          requires_action: true
        },
        {
          id: '3',
          type: 'transfer_request',
          title: 'Transfer Request',
          description: 'Hand sanitizer needed from main warehouse',
          location_id: currentLocationId,
          location_name: nearestLocation?.name || 'Current Location',
          priority: 'low',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          requires_action: false
        }
      ];

      return currentLocationId ? mockOperations : [];
    },
    enabled: !!currentLocationId
  });

  // Setup offline/online detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing data...');
      refetchOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are now offline. Some features may be limited.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refetchOperations]);

  // Auto-detect location on mount
  useEffect(() => {
    if (nearestLocation) {
      setCurrentLocationId(nearestLocation.id);
      toast.success(`Located at ${nearestLocation.name}`);
    }
  }, [nearestLocation]);

  // Setup PWA installation prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('App installed successfully!');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const handleOperationAction = (operation: LocationAwareOperation) => {
    setSelectedOperation(operation);
    
    switch (operation.type) {
      case 'reorder_alert':
      case 'transfer_request':
        setShowRequestModal(true);
        break;
      case 'stock_check':
        // Navigate to stock count interface
        toast.info('Opening stock count interface...');
        break;
      default:
        toast.info(`Processing ${operation.type}...`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityIcon = (type: string) => {
    switch (type) {
      case 'stock_check':
        return <Package className="w-4 h-4" />;
      case 'reorder_alert':
        return <AlertCircle className="w-4 h-4" />;
      case 'transfer_request':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* PWA Status & Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-500" />
            Mobile Location Manager
            <div className="flex items-center gap-2 ml-auto">
              {isOnline ? (
                <Badge variant="outline" className="gap-1">
                  <Wifi className="w-3 h-3 text-green-500" />
                  Online
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <WifiOff className="w-3 h-3 text-red-500" />
                  Offline
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Installation Prompt */}
          {isInstallable && (
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Install Mobile App</h4>
                  <p className="text-sm text-blue-700">
                    Install for faster access and offline capabilities
                  </p>
                </div>
                <Button onClick={handleInstallPWA} size="sm" className="gap-1">
                  <Download className="w-3 h-3" />
                  Install
                </Button>
              </div>
            </div>
          )}

          {/* Notifications Setup */}
          {notificationsSupported && notificationPermission !== 'granted' && (
            <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-orange-900">Enable Notifications</h4>
                  <p className="text-sm text-orange-700">
                    Get real-time alerts for stock levels and task updates
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    // Request notification permission manually
                    if ('Notification' in window) {
                      Notification.requestPermission();
                    }
                  }} 
                  size="sm" 
                  variant="outline"
                  className="gap-1"
                >
                  <Bell className="w-3 h-3" />
                  Enable
                </Button>
              </div>
            </div>
          )}

          {/* Location Detection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Location</label>
              <div className="flex gap-2">
                <StorageLocationSelector
                  value={currentLocationId}
                  onValueChange={setCurrentLocationId}
                  placeholder="Select location"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getCurrentPosition}
                  disabled={!!locationError}
                  className="gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  Auto-detect
                </Button>
              </div>
              {nearestLocation && (
                <p className="text-xs text-green-600">
                  📍 Nearest: {nearestLocation.name}
                </p>
              )}
              {locationError && (
                <p className="text-xs text-red-600">
                  Location access denied or unavailable
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">GPS Coordinates</label>
              <div className="text-sm text-muted-foreground p-2 border rounded">
                {location ? (
                  `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                ) : (
                  'Location not available'
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location-Aware Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-500" />
            Location Tasks & Alerts
            {locationOperations && locationOperations.length > 0 && (
              <Badge variant="outline">{locationOperations.length} active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentLocationId ? (
            locationOperations && locationOperations.length > 0 ? (
              <div className="space-y-3">
                {locationOperations.map((operation) => (
                  <div
                    key={operation.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getPriorityIcon(operation.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{operation.title}</h4>
                            <Badge variant={getPriorityColor(operation.priority) as any}>
                              {operation.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {operation.description}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <MapPin className="w-3 h-3" />
                            {operation.location_name}
                          </div>
                        </div>
                      </div>
                      
                      {operation.requires_action && (
                        <Button
                          size="sm"
                          onClick={() => handleOperationAction(operation)}
                          disabled={!isOnline}
                        >
                          Take Action
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium mb-1">No Active Tasks</h3>
                <p className="text-sm">All tasks completed at this location!</p>
              </div>
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <h3 className="font-medium mb-1">Select Location</h3>
              <p className="text-sm">Choose your current location to view relevant tasks</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Modal - Simplified for now */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Quick Request</h3>
            <p className="text-muted-foreground mb-4">
              Request sent for {selectedOperation?.title} at {selectedOperation?.location_name}
            </p>
            <Button onClick={() => {
              setShowRequestModal(false);
              setSelectedOperation(null);
            }}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};