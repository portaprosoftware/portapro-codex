import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare,
  Settings,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PushNotificationSupport() {
  const { toast } = useToast();

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Not Supported",
        description: "This browser does not support push notifications.",
        variant: "destructive"
      });
      return;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      toast({
        title: "Notifications Enabled",
        description: "You will now receive compliance reminders on this device."
      });
      
      // Send test notification
      new Notification('PortaPro Notifications Enabled', {
        body: 'You will receive important compliance updates here.',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    } else {
      toast({
        title: "Permission Denied",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive"
      });
    }
  };

  const sendTestNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from PortaPro.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification',
        requireInteraction: true
      });
    } else {
      toast({
        title: "Permission Required",
        description: "Please enable notifications first.",
        variant: "destructive"
      });
    }
  };

  const notificationStatus = Notification.permission;

  const getStatusBadge = () => {
    switch (notificationStatus) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Enabled</Badge>;
      case 'denied':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Blocked</Badge>;
      default:
        return <Badge variant="outline"><Bell className="h-3 w-3 mr-1" />Not Set</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Push Notifications</h2>
          <p className="text-muted-foreground">
            Configure mobile and browser notifications for compliance alerts
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Browser Support Check */}
      {!('Notification' in window) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your browser does not support push notifications. Please use a modern browser like Chrome, Firefox, or Safari.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile Notifications
            </CardTitle>
            <CardDescription>
              Get push notifications on your mobile device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Status</span>
                {getStatusBadge()}
              </div>

              {notificationStatus === 'default' && (
                <Button onClick={requestNotificationPermission} className="w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  Enable Notifications
                </Button>
              )}

              {notificationStatus === 'granted' && (
                <div className="space-y-2">
                  <Button onClick={sendTestNotification} variant="outline" className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Send Test Notification
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    You can disable notifications in your browser settings
                  </p>
                </div>
              )}

              {notificationStatus === 'denied' && (
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    Notifications are blocked. To enable them:
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Click the lock icon in your address bar</li>
                      <li>Change notifications to "Allow"</li>
                      <li>Refresh this page</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Notification Types
            </CardTitle>
            <CardDescription>
              Types of notifications you'll receive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">License Expiration</p>
                  <p className="text-xs text-muted-foreground">7 days before expiry</p>
                </div>
                <Badge variant="outline">High Priority</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Medical Card Expiration</p>
                  <p className="text-xs text-muted-foreground">30 days before expiry</p>
                </div>
                <Badge variant="outline">High Priority</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Training Due</p>
                  <p className="text-xs text-muted-foreground">14 days before due date</p>
                </div>
                <Badge variant="outline">Medium Priority</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Document Upload Required</p>
                  <p className="text-xs text-muted-foreground">When action is needed</p>
                </div>
                <Badge variant="outline">Medium Priority</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Features</CardTitle>
          <CardDescription>
            What you can expect from PortaPro push notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium mb-2">Real-time Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Get instant notifications for critical compliance deadlines
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium mb-2">Smart Scheduling</h3>
              <p className="text-sm text-muted-foreground">
                Notifications are sent during business hours for better engagement
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Smartphone className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium mb-2">Cross-Platform</h3>
              <p className="text-sm text-muted-foreground">
                Works on desktop browsers and mobile devices
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Note */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> This is the basic browser notification implementation. 
          For production use, consider implementing a full push notification service 
          with Firebase Cloud Messaging (FCM) or similar service for better reliability 
          and offline support.
        </AlertDescription>
      </Alert>
    </div>
  );
}