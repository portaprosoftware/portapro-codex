import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PadlockStatusIcon } from '@/components/inventory/PadlockStatusIcon';
import { PadlockManagementDialog } from '@/components/inventory/PadlockManagementDialog';
import { usePadlockSecurity } from '@/hooks/usePadlockSecurity';
import { Lock, Unlock, MapPin, Clock, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MobilePadlockActionsProps {
  items: Array<{
    id: string;
    item_code: string;
    product_name: string;
    currently_padlocked: boolean;
    padlock_type?: string;
    supports_padlock: boolean;
    last_padlock_timestamp?: string;
    last_unlock_timestamp?: string;
  }>;
  jobId?: string;
  onLocationCapture?: () => Promise<GeolocationPosition>;
}

export const MobilePadlockActions: React.FC<MobilePadlockActionsProps> = ({
  items,
  jobId,
  onLocationCapture
}) => {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showPadlockDialog, setShowPadlockDialog] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);

  const padlockedItems = items.filter(item => item.currently_padlocked && item.supports_padlock);
  const unlockedItems = items.filter(item => !item.currently_padlocked && item.supports_padlock);

  const handleQuickAction = async (item: any, action: 'unlock' | 'padlock') => {
    setSelectedItem(item);
    
    // Capture location if available
    if (onLocationCapture) {
      setCapturingLocation(true);
      try {
        await onLocationCapture();
      } catch (error) {
        toast({
          title: "Location Access",
          description: "Could not capture location, continuing without GPS coordinates",
          variant: "destructive",
        });
      }
      setCapturingLocation(false);
    }
    
    setShowPadlockDialog(true);
  };

  const getActionButtonText = (item: any) => {
    if (capturingLocation) return 'Getting Location...';
    if (item.currently_padlocked) return 'Unlock for Service';
    return 'Re-padlock Unit';
  };

  const getActionIcon = (item: any) => {
    if (item.currently_padlocked) return Unlock;
    return Lock;
  };

  if (items.filter(item => item.supports_padlock).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Padlock Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No units on this job support external padlocks.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Padlock Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Currently Padlocked Units */}
          {padlockedItems.length > 0 && (
            <div>
              <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Locked Units ({padlockedItems.length})
              </h4>
              <div className="space-y-2">
                {padlockedItems.map((item) => {
                  const ActionIcon = getActionIcon(item);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-3">
                        <PadlockStatusIcon
                          currentlyPadlocked={item.currently_padlocked}
                          padlockType={item.padlock_type as any}
                          className="h-5 w-5"
                        />
                        <div>
                          <p className="font-mono text-sm font-medium">{item.item_code}</p>
                          <p className="text-xs text-muted-foreground">{item.product_name}</p>
                          {item.padlock_type && (
                            <Badge variant="outline" className="text-xs">
                              {item.padlock_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleQuickAction(item, 'unlock')}
                        disabled={capturingLocation}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <ActionIcon className="h-4 w-4 mr-1" />
                        {getActionButtonText(item)}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unlocked Units */}
          {unlockedItems.length > 0 && (
            <div>
              <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                <Unlock className="h-4 w-4" />
                Unlocked Units ({unlockedItems.length})
              </h4>
              <div className="space-y-2">
                {unlockedItems.map((item) => {
                  const ActionIcon = getActionIcon(item);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <PadlockStatusIcon
                          currentlyPadlocked={item.currently_padlocked}
                          padlockType={item.padlock_type as any}
                          className="h-5 w-5"
                        />
                        <div>
                          <p className="font-mono text-sm font-medium">{item.item_code}</p>
                          <p className="text-xs text-muted-foreground">{item.product_name}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleQuickAction(item, 'padlock')}
                        disabled={capturingLocation}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <ActionIcon className="h-4 w-4 mr-1" />
                        {getActionButtonText(item)}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Location Status */}
          {onLocationCapture && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>GPS coordinates will be captured with padlock operations</span>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedItem && (
        <PadlockManagementDialog
          isOpen={showPadlockDialog}
          onClose={() => {
            setShowPadlockDialog(false);
            setSelectedItem(null);
          }}
          itemId={selectedItem.id}
          itemCode={selectedItem.item_code}
          currentlyPadlocked={selectedItem.currently_padlocked}
          supportsPadlock={selectedItem.supports_padlock}
        />
      )}
    </>
  );
};