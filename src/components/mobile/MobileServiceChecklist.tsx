import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MobilePadlockActions } from './MobilePadlockActions';
import { PadlockStatusIcon } from '@/components/inventory/PadlockStatusIcon';
import { CheckCircle, Clock, MapPin, AlertTriangle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ServiceItem {
  id: string;
  item_code: string;
  product_name: string;
  currently_padlocked: boolean;
  padlock_type?: string;
  supports_padlock: boolean;
  last_padlock_timestamp?: string;
  last_unlock_timestamp?: string;
}

interface MobileServiceChecklistProps {
  jobId: string;
  items: ServiceItem[];
  onServiceComplete?: (itemId: string, completed: boolean) => void;
}

const defaultChecklistItems = [
  { id: 'inspect', label: 'Visual Inspection', required: true },
  { id: 'clean', label: 'Clean Unit', required: true },
  { id: 'restock', label: 'Restock Supplies', required: false },
  { id: 'repairs', label: 'Check for Repairs Needed', required: true },
  { id: 'documentation', label: 'Update Service Log', required: true },
];

export const MobileServiceChecklist: React.FC<MobileServiceChecklistProps> = ({
  jobId,
  items,
  onServiceComplete
}) => {
  const { toast } = useToast();
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [serviceStartTime] = useState(new Date());
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);

  const padlockedItems = items.filter(item => item.currently_padlocked && item.supports_padlock);
  const overdueItems = items.filter(item => {
    if (!item.currently_padlocked || !item.last_padlock_timestamp) return false;
    const padlockTime = new Date(item.last_padlock_timestamp);
    const now = new Date();
    const hoursOverdue = (now.getTime() - padlockTime.getTime()) / (1000 * 60 * 60);
    return hoursOverdue > 24; // Overdue after 24 hours
  });

  const handleLocationCapture = async (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position);
          resolve(position);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const handleChecklistItemToggle = (itemId: string, checked: boolean) => {
    setCompletedItems(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  const requiredItemsCompleted = defaultChecklistItems
    .filter(item => item.required)
    .every(item => completedItems[item.id]);

  const allItemsCompleted = defaultChecklistItems
    .every(item => completedItems[item.id]);

  const getServiceProgress = () => {
    const completed = Object.values(completedItems).filter(Boolean).length;
    const total = defaultChecklistItems.length;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Pre-Service Alerts */}
      {(padlockedItems.length > 0 || overdueItems.length > 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Pre-Service Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {padlockedItems.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-red-500" />
                <span>{padlockedItems.length} units require unlocking before service</span>
              </div>
            )}
            {overdueItems.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>{overdueItems.length} units are overdue for pickup</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Padlock Management */}
      <MobilePadlockActions
        items={items}
        jobId={jobId}
        onLocationCapture={handleLocationCapture}
      />

      {/* Service Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Service Checklist
            </div>
            <Badge variant={allItemsCompleted ? "default" : "secondary"}>
              {getServiceProgress()}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {defaultChecklistItems.map((item) => (
            <div key={item.id} className="flex items-center space-x-3">
              <Checkbox
                id={item.id}
                checked={completedItems[item.id] || false}
                onCheckedChange={(checked) => handleChecklistItemToggle(item.id, checked as boolean)}
              />
              <label
                htmlFor={item.id}
                className={`text-sm flex-1 ${
                  completedItems[item.id] ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {item.label}
                {item.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              {completedItems[item.id] && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
          ))}

          {/* Service Progress */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{getServiceProgress()}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getServiceProgress()}%` }}
              />
            </div>
          </div>

          {/* Location Status */}
          {currentLocation && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <MapPin className="h-3 w-3" />
              <span>
                Location captured: {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
              </span>
            </div>
          )}

          {/* Service Timer */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Service started: {serviceStartTime.toLocaleTimeString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Complete Service Button */}
      <Button
        className="w-full"
        size="lg"
        disabled={!requiredItemsCompleted}
        onClick={() => {
          if (allItemsCompleted) {
            toast({
              title: "Service Completed",
              description: "All checklist items completed successfully",
            });
          } else {
            toast({
              title: "Service Incomplete",
              description: "Some optional items remain unchecked",
              variant: "destructive",
            });
          }
        }}
      >
        {requiredItemsCompleted 
          ? (allItemsCompleted ? 'Complete Service' : 'Complete Service (Optional Items Remaining)')
          : 'Complete Required Items First'
        }
      </Button>
    </div>
  );
};