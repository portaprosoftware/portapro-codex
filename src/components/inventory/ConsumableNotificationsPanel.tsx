import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, AlertTriangle, Mail, MessageSquare, Clock, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface NotificationSetting {
  id: string;
  notification_type: string;
  is_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  threshold_value?: number;
  recipient_emails?: string[];
  recipient_phones?: string[];
}

interface Alert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'high_usage' | 'reorder_suggestion';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  consumable_id?: string;
  consumable_name?: string;
  created_at: string;
  acknowledged: boolean;
}

export const ConsumableNotificationsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'settings'>('alerts');
  const queryClient = useQueryClient();

  // Mock alerts data - in real app, this would come from database
  const mockAlerts: Alert[] = [
    {
      id: '1',
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: 'Toilet Paper is running low (5 units remaining, reorder threshold: 10)',
      severity: 'high',
      consumable_name: 'Toilet Paper',
      created_at: new Date().toISOString(),
      acknowledged: false
    },
    {
      id: '2',
      type: 'out_of_stock',
      title: 'Out of Stock',
      message: 'Hand Sanitizer is out of stock',
      severity: 'critical',
      consumable_name: 'Hand Sanitizer',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      acknowledged: false
    },
    {
      id: '3',
      type: 'reorder_suggestion',
      title: 'Reorder Suggestion',
      message: 'Based on usage patterns, consider reordering Paper Towels',
      severity: 'medium',
      consumable_name: 'Paper Towels',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      acknowledged: true
    }
  ];

  // Mock settings data
  const mockSettings: NotificationSetting[] = [
    {
      id: '1',
      notification_type: 'low_stock',
      is_enabled: true,
      email_enabled: true,
      sms_enabled: false,
      threshold_value: 10,
      recipient_emails: ['manager@company.com'],
      recipient_phones: []
    },
    {
      id: '2',
      notification_type: 'out_of_stock',
      is_enabled: true,
      email_enabled: true,
      sms_enabled: true,
      recipient_emails: ['manager@company.com', 'purchasing@company.com'],
      recipient_phones: ['+1234567890']
    },
    {
      id: '3',
      notification_type: 'reorder_suggestion',
      is_enabled: true,
      email_enabled: true,
      sms_enabled: false,
      recipient_emails: ['purchasing@company.com']
    }
  ];

  const acknowledgeAlert = (alertId: string) => {
    toast.success('Alert acknowledged');
    // In real app, update database
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const unacknowledgedAlerts = mockAlerts.filter(a => !a.acknowledged);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Consumable Notifications & Alerts
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant={activeTab === 'alerts' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('alerts')}
            >
              Active Alerts ({unacknowledgedAlerts.length})
            </Button>
            <Button 
              variant={activeTab === 'settings' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {mockAlerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No alerts at this time</p>
              ) : (
                <div className="space-y-3">
                  {mockAlerts.map(alert => (
                    <Card key={alert.id} className={`${alert.acknowledged ? 'opacity-60' : ''}`}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {getSeverityIcon(alert.severity)}
                              <span className="font-medium">{alert.title}</span>
                              <Badge variant={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              {alert.acknowledged && (
                                <Badge variant="outline">Acknowledged</Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{new Date(alert.created_at).toLocaleString()}</span>
                              {alert.consumable_name && (
                                <span>Item: {alert.consumable_name}</span>
                              )}
                            </div>
                          </div>

                          {!alert.acknowledged && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid gap-6">
                {mockSettings.map(setting => (
                  <Card key={setting.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium capitalize">
                              {setting.notification_type.replace('_', ' ')} Notifications
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Configure when and how to receive these alerts
                            </p>
                          </div>
                          <Switch checked={setting.is_enabled} />
                        </div>

                        {setting.is_enabled && (
                          <div className="space-y-4 pl-4 border-l-2 border-muted">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <Label>Email</Label>
                                <Switch checked={setting.email_enabled} />
                              </div>
                              <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                <Label>SMS</Label>
                                <Switch checked={setting.sms_enabled} />
                              </div>
                            </div>

                            {setting.threshold_value && (
                              <div>
                                <Label>Threshold Value</Label>
                                <Input 
                                  type="number" 
                                  value={setting.threshold_value} 
                                  className="w-24 mt-1"
                                />
                              </div>
                            )}

                            <div>
                              <Label>Email Recipients</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {setting.recipient_emails?.map((email, idx) => (
                                  <Badge key={idx} variant="outline">{email}</Badge>
                                ))}
                                <Button size="sm" variant="outline">Add Email</Button>
                              </div>
                            </div>

                            {setting.sms_enabled && (
                              <div>
                                <Label>SMS Recipients</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {setting.recipient_phones?.map((phone, idx) => (
                                    <Badge key={idx} variant="outline">{phone}</Badge>
                                  ))}
                                  <Button size="sm" variant="outline">Add Phone</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end">
                <Button>Save Settings</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};