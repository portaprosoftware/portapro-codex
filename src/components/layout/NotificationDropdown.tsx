import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, MessageCircle, Plus, Wrench, CheckCheck, Clock, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeedbackItem {
  id: string;
  unit_id: string;
  feedback_type: 'assistance' | 'comment';
  customer_message: string;
  customer_email?: string;
  customer_phone?: string;
  photo_url?: string;
  is_read: boolean;
  created_at: string;
  product_items?: {
    item_code: string;
    products?: {
      name: string;
    };
  };
}

interface NotificationDropdownProps {
  feedbackData: FeedbackItem[];
  onClose: () => void;
  onMarkAsRead: (feedbackId: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  feedbackData,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead
}) => {
  const navigate = useNavigate();

  const handleCreateJob = (unitId: string, feedbackId: string) => {
    onMarkAsRead(feedbackId);
    onClose();
    navigate(`/jobs?unit=${unitId}&type=delivery`);
  };

  const handleEmergencyService = (unitId: string, feedbackId: string) => {
    onMarkAsRead(feedbackId);
    onClose();
    navigate(`/jobs?unit=${unitId}&type=service&priority=emergency`);
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  const unreadCount = feedbackData.filter(item => !item.is_read).length;

  return (
    <div className="absolute right-0 top-12 z-50">
      <Card className="w-96 max-h-96 shadow-lg border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">QR Feedback</CardTitle>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark All Read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                ✕
              </Button>
            </div>
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread feedback item{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {feedbackData.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No feedback received yet</p>
            </div>
          ) : (
            <ScrollArea className="h-80">
              <div className="space-y-2 p-3">
                {feedbackData.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border ${
                      !item.is_read ? 'bg-blue-50 border-blue-200' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {item.feedback_type === 'assistance' ? (
                          <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        ) : (
                          <MessageCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                        <Badge
                          variant={item.feedback_type === 'assistance' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {item.feedback_type === 'assistance' ? 'Assistance' : 'Comment'}
                        </Badge>
                        {!item.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </div>
                    </div>

                    <div className="mb-2">
                      <p className="text-sm font-medium">
                        Unit: {item.product_items?.item_code || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {truncateMessage(item.customer_message)}
                      </p>
                    </div>

                    {item.customer_email && (
                      <p className="text-xs text-muted-foreground mb-2">
                        Contact: {item.customer_email}
                      </p>
                    )}

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateJob(item.unit_id, item.id)}
                        className="flex-1 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Create Job
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEmergencyService(item.unit_id, item.id)}
                        className="flex-1 text-xs"
                      >
                        <Wrench className="w-3 h-3 mr-1" />
                        Emergency
                      </Button>
                    </div>

                    {!item.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkAsRead(item.id)}
                        className="w-full mt-2 text-xs"
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
  );
};