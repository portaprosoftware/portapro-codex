import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Briefcase, 
  Calendar, 
  CheckCheck, 
  Clock, 
  Bell, 
  Truck, 
  MessageCircle,
  AlertTriangle,
  ClipboardCheck,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DriverNotification } from '@/hooks/useDriverNotifications';

interface DriverNotificationDropdownProps {
  notifications: DriverNotification[];
  onClose: () => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
}

export const DriverNotificationDropdown: React.FC<DriverNotificationDropdownProps> = ({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead
}) => {
  const navigate = useNavigate();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_assigned':
      case 'job_updated':
      case 'job_status_update':
        return <Briefcase className="w-4 h-4 text-blue-500 flex-shrink-0" />;
      case 'job_cancelled':
        return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      case 'schedule_changed':
        return <Calendar className="w-4 h-4 text-purple-500 flex-shrink-0" />;
      case 'dvir_reminder':
        return <ClipboardCheck className="w-4 h-4 text-orange-500 flex-shrink-0" />;
      case 'vehicle_assigned':
        return <Truck className="w-4 h-4 text-green-500 flex-shrink-0" />;
      case 'message_received':
        return <MessageCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500 flex-shrink-0" />;
    }
  };

  const getNotificationBadgeVariant = (type: string) => {
    switch (type) {
      case 'job_cancelled':
        return 'destructive';
      case 'dvir_reminder':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const handleNotificationClick = (notification: DriverNotification) => {
    onMarkAsRead(notification.id);
    
    if (notification.related_entity_type === 'job' && notification.related_entity_id) {
      onClose();
      navigate(`/driver/schedule`);
    } else if (notification.notification_type === 'schedule_changed') {
      onClose();
      navigate('/driver/schedule');
    } else if (notification.notification_type === 'dvir_reminder') {
      onClose();
      navigate('/driver/dvir');
    }
  };

  const truncateMessage = (message: string, maxLength: number = 80) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-2 px-2"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Card className="w-[min(380px,100vw)] max-h-[80vh] shadow-lg border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllAsRead}
                    className="text-xs h-8"
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Mark All Read</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[min(60vh,400px)]">
                <div className="space-y-2 p-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        !notification.read_at 
                          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                          : 'bg-background hover:bg-slate-50'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getNotificationIcon(notification.notification_type)}
                          <Badge
                            variant={getNotificationBadgeVariant(notification.notification_type)}
                            className="text-xs whitespace-nowrap"
                          >
                            {notification.notification_type.replace(/_/g, ' ')}
                          </Badge>
                          {!notification.read_at && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground ml-2 flex-shrink-0">
                          <Clock className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          <span className="sm:hidden">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }).replace('about ', '')}
                          </span>
                        </div>
                      </div>

                      <div className="mb-2">
                        <p className="text-sm font-medium break-words">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground break-words">
                          {truncateMessage(notification.body)}
                        </p>
                      </div>

                      {!notification.read_at && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(notification.id);
                          }}
                          className="w-full mt-2 text-xs h-8"
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
