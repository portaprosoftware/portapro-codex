import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  TestTube, 
  Mail, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const notificationTypes = [
  { key: 'job_assignment', label: 'Job Assignment', icon: '🔔' },
  { key: 'route_schedule_change', label: 'Route Schedule Change', icon: '📍' },
  { key: 'maintenance_alert', label: 'Maintenance Alert', icon: '🔧' },
  { key: 'quote_update', label: 'Quote Update', icon: '💼' },
  { key: 'invoice_reminder', label: 'Invoice Reminder', icon: '💳' },
  { key: 'payment_confirmation', label: 'Payment Confirmation', icon: '✅' },
  { key: 'low_stock_alert', label: 'Low Stock Alert', icon: '📦' },
  { key: 'asset_movement', label: 'Asset Movement', icon: '🚚' },
  { key: 'vehicle_status_change', label: 'Vehicle Status Change', icon: '🚛' },
  { key: 'driver_checkin', label: 'Driver Check-In', icon: '👤' },
  { key: 'new_team_member', label: 'New Team Member', icon: '👥' },
  { key: 'comment_mention', label: 'Comment Mention', icon: '💬' }
];

export function NotificationTestingCard() {
  const { user } = useUserRole();
  const [testingType, setTestingType] = useState<string | null>(null);
  const [testingChannel, setTestingChannel] = useState<'email' | 'push' | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  const handleTest = async (notificationType: string, channel: 'email' | 'push') => {
    if (!user?.id) {
      toast.error('Please log in to test notifications');
      return;
    }

    setTestingType(notificationType);
    setTestingChannel(channel);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-test-notification', {
        body: {
          userId: user.id,
          notificationType,
          channel
        }
      });

      if (error) throw error;

      setResults(prev => ({
        ...prev,
        [`${notificationType}_${channel}`]: {
          success: true,
          timestamp: new Date().toISOString(),
          data
        }
      }));

      toast.success(`Test ${channel} notification sent!`, {
        description: `Check your ${channel === 'email' ? 'inbox' : 'browser notifications'}`
      });
    } catch (error: any) {
      console.error('Test notification error:', error);
      setResults(prev => ({
        ...prev,
        [`${notificationType}_${channel}`]: {
          success: false,
          timestamp: new Date().toISOString(),
          error: error.message
        }
      }));
      toast.error('Test notification failed', {
        description: error.message
      });
    } finally {
      setTestingType(null);
      setTestingChannel(null);
    }
  };

  const getResultIcon = (notificationType: string, channel: string) => {
    const result = results[`${notificationType}_${channel}`];
    if (!result) return null;
    return result.success ? (
      <CheckCircle2 className="w-3 h-3 text-green-600" />
    ) : (
      <XCircle className="w-3 h-3 text-red-600" />
    );
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-lg">
            <TestTube className="w-5 h-5 text-white" />
          </div>
          <div>
            <div>Test Notifications</div>
            <CardDescription className="text-sm font-normal mt-0.5">
              Send test notifications to verify your setup
            </CardDescription>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Click the buttons below to send test notifications. Email tests will be sent to your configured email address, 
            and push tests will appear as browser notifications if you've subscribed.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {notificationTypes.map((type) => (
            <div 
              key={type.key} 
              className="p-4 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{type.icon}</span>
                  <span className="font-medium text-sm">{type.label}</span>
                </div>
                <div className="flex gap-2">
                  {/* Email Test Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTest(type.key, 'email')}
                    disabled={testingType !== null}
                    className="gap-1.5"
                  >
                    {testingType === type.key && testingChannel === 'email' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        {getResultIcon(type.key, 'email') || <Mail className="w-3.5 h-3.5" />}
                      </>
                    )}
                    <span className="text-xs">Email</span>
                  </Button>

                  {/* Push Test Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTest(type.key, 'push')}
                    disabled={testingType !== null}
                    className="gap-1.5"
                  >
                    {testingType === type.key && testingChannel === 'push' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        {getResultIcon(type.key, 'push') || <Smartphone className="w-3.5 h-3.5" />}
                      </>
                    )}
                    <span className="text-xs">Push</span>
                  </Button>
                </div>
              </div>
              
              {/* Show last test result */}
              {(results[`${type.key}_email`] || results[`${type.key}_push`]) && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {results[`${type.key}_email`] && (
                      <Badge variant={results[`${type.key}_email`].success ? 'default' : 'destructive'} className="text-xs">
                        Email: {results[`${type.key}_email`].success ? 'Sent' : 'Failed'}
                      </Badge>
                    )}
                    {results[`${type.key}_push`] && (
                      <Badge variant={results[`${type.key}_push`].success ? 'default' : 'destructive'} className="text-xs">
                        Push: {results[`${type.key}_push`].success ? 'Sent' : 'Failed'}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> These are test notifications only. They do not affect your actual notification logs 
            or create real database records.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
