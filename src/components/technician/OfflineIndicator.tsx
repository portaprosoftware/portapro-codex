import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  WifiOff, 
  Wifi, 
  CloudUpload, 
  CheckCircle2,
  Clock,
  Camera,
  FileText
} from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isSyncing, syncProgress, stats, performSync } = useOfflineSync();

  if (isOnline && stats.queuedOperations === 0 && stats.unsyncedPhotos === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom">
      <Card className="p-4 shadow-lg border-2">
        {/* Online/Offline Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-700 dark:text-green-400">
                  Online
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-orange-500" />
                <span className="font-medium text-orange-700 dark:text-orange-400">
                  Offline Mode
                </span>
              </>
            )}
          </div>

          {isOnline && (stats.queuedOperations > 0 || stats.unsyncedPhotos > 0) && !isSyncing && (
            <Button
              onClick={performSync}
              size="sm"
              variant="outline"
              className="h-8"
            >
              <CloudUpload className="h-4 w-4 mr-1" />
              Sync Now
            </Button>
          )}
        </div>

        {/* Sync Progress */}
        {isSyncing && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Syncing...</span>
              <span className="text-xs text-muted-foreground">
                {syncProgress.current} / {syncProgress.total}
              </span>
            </div>
            <Progress 
              value={(syncProgress.current / syncProgress.total) * 100} 
              className="h-2"
            />
          </div>
        )}

        {/* Pending Items */}
        {!isSyncing && (stats.queuedOperations > 0 || stats.unsyncedPhotos > 0) && (
          <div className="space-y-2">
            {stats.unsyncedPhotos > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span>Photos pending upload</span>
                </div>
                <Badge variant="secondary">{stats.unsyncedPhotos}</Badge>
              </div>
            )}

            {stats.queuedOperations > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Updates pending sync</span>
                </div>
                <Badge variant="secondary">{stats.queuedOperations}</Badge>
              </div>
            )}

            {!isOnline && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <Clock className="h-3 w-3" />
                <span>Will sync automatically when back online</span>
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {isOnline && stats.queuedOperations === 0 && stats.unsyncedPhotos === 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>All data synced</span>
          </div>
        )}
      </Card>
    </div>
  );
};
