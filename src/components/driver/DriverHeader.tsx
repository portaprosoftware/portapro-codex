
import React from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDriverNotifications } from '@/hooks/useDriverNotifications';
import { DriverNotificationDropdown } from './DriverNotificationDropdown';

export const DriverHeader: React.FC = () => {
  const { user } = useUser();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useDriverNotifications();

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div 
        className="px-4 py-3" 
        style={{ 
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(16px, env(safe-area-inset-right))'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                Welcome, {user?.firstName || 'Driver'}
              </h1>
              <div className="flex items-center space-x-2">
                <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3 mr-1" />
                      Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 mr-1" />
                      Offline
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-10 w-10"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full p-0 px-1 flex items-center justify-center text-xs bg-gradient-to-r from-red-500 to-red-600 animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
            
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
              afterSignOutUrl="https://www.portaprosoftware.com"
            />
          </div>
        </div>
      </div>

      {showNotifications && (
        <DriverNotificationDropdown
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />
      )}
    </header>
  );
};
