import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  Bell, 
  BellOff, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Smartphone,
  Chrome,
  Monitor,
  Loader2
} from "lucide-react";

export function PushSubscriptionCard() {
  const { user } = useUserRole();
  const { 
    isSupported, 
    permission, 
    subscription, 
    subscribe, 
    unsubscribe,
    isSubscribing,
    isUnsubscribing 
  } = usePushNotifications(user?.id);

  const getBrowserIcon = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return Chrome;
    if (userAgent.includes('mobile')) return Smartphone;
    return Monitor;
  };

  const getBrowserName = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('edg')) return 'Edge';
    if (userAgent.includes('chrome')) return 'Chrome';
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('safari')) return 'Safari';
    if (userAgent.includes('mobile')) return 'Mobile Browser';
    return 'Browser';
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { 
          icon: CheckCircle2, 
          color: 'text-green-600', 
          bg: 'bg-green-100 dark:bg-green-950',
          label: 'Granted' 
        };
      case 'denied':
        return { 
          icon: XCircle, 
          color: 'text-red-600', 
          bg: 'bg-red-100 dark:bg-red-950',
          label: 'Denied' 
        };
      default:
        return { 
          icon: AlertTriangle, 
          color: 'text-yellow-600', 
          bg: 'bg-yellow-100 dark:bg-yellow-950',
          label: 'Not Set' 
        };
    }
  };

  const BrowserIcon = getBrowserIcon();
  const permissionStatus = getPermissionStatus();
  const PermissionIcon = permissionStatus.icon;

  if (!isSupported) {
    return (
      <Card className="border-2 border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5 text-muted-foreground" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Browser push notification settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Push notifications are not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-lg">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <div>Push Notifications</div>
            <CardDescription className="text-sm font-normal mt-0.5">
              Manage browser push notification subscriptions
            </CardDescription>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Browser Support */}
          <div className="p-4 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-950 rounded-md">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm font-medium">Browser Support</span>
            </div>
            <div className="flex items-center gap-2">
              <BrowserIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{getBrowserName()}</span>
            </div>
          </div>

          {/* Permission Status */}
          <div className="p-4 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 ${permissionStatus.bg} rounded-md`}>
                <PermissionIcon className={`w-4 h-4 ${permissionStatus.color}`} />
              </div>
              <span className="text-sm font-medium">Permission</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={permission === 'granted' ? 'default' : 'secondary'} className="text-xs">
                {permissionStatus.label}
              </Badge>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="p-4 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 ${subscription ? 'bg-green-100 dark:bg-green-950' : 'bg-muted'} rounded-md`}>
                {subscription ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <BellOff className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <span className="text-sm font-medium">Subscription</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={subscription ? 'default' : 'secondary'} className="text-xs">
                {subscription ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Subscription Details */}
        {subscription && (
          <div className="p-4 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Device Information</span>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Browser:</span> {getBrowserName()}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                <span className="font-medium">Endpoint:</span> {subscription.endpoint.slice(0, 50)}...
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!subscription ? (
            <Button 
              onClick={() => subscribe()} 
              disabled={isSubscribing || permission === 'denied'}
              className="flex-1"
              size="lg"
            >
              {isSubscribing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Enable Push Notifications
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={() => unsubscribe()} 
              disabled={isUnsubscribing}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              {isUnsubscribing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Unsubscribing...
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 mr-2" />
                  Disable Push Notifications
                </>
              )}
            </Button>
          )}
        </div>

        {/* Help Text */}
        {permission === 'denied' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Push notifications are blocked. To enable them, click the lock icon in your browser's address bar and allow notifications for this site.
            </AlertDescription>
          </Alert>
        )}

        {!subscription && permission !== 'denied' && (
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>What are push notifications?</strong> Get instant alerts for job assignments, route changes, and important updates even when PortaPro isn't open.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
