import React from 'react';
import { Settings, Download, MessageCircle, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const SettingsSection: React.FC = () => {
  const [pushNotifications, setPushNotifications] = React.useState(true);

  const handleDownloadPWA = () => {
    // Check if app is already installed or prompt is available
    if ('serviceWorker' in navigator) {
      toast.info('To install the app, tap the share button in your browser and select "Add to Home Screen"');
    } else {
      toast.info('PWA installation not available on this device');
    }
  };

  const handleContactSupport = () => {
    // Open email client or contact form
    const email = 'support@portapro.com';
    const subject = 'Driver App Support Request';
    const body = 'Hi, I need help with the PortaPro driver app...';
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setPushNotifications(enabled);
    
    if (enabled) {
      // Request notification permission
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            toast.success('Push notifications enabled');
          } else {
            toast.error('Notification permission denied');
            setPushNotifications(false);
          }
        });
      }
    } else {
      toast.success('Push notifications disabled');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Settings & Help</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Notifications Setting */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {pushNotifications ? (
              <Bell className="w-5 h-5 text-blue-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <Label htmlFor="notifications" className="text-sm font-medium">
                Push Notifications
              </Label>
              <p className="text-xs text-gray-500">
                Get notified about new jobs and updates
              </p>
            </div>
          </div>
          <Switch
            id="notifications"
            checked={pushNotifications}
            onCheckedChange={handleNotificationToggle}
          />
        </div>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* PWA Download */}
        <div>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleDownloadPWA}
          >
            <Download className="w-4 h-4 mr-3" />
            Download Mobile App
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Install the app on your home screen for easier access
          </p>
        </div>

        {/* Contact Support */}
        <div>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleContactSupport}
          >
            <MessageCircle className="w-4 h-4 mr-3" />
            Contact Support
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Get help with the app or report issues
          </p>
        </div>
      </CardContent>
    </Card>
  );
};