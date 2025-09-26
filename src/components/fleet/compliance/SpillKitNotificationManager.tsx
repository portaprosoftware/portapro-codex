import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Mail, MessageSquare, Settings, AlertTriangle, Clock, CheckCircle, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface NotificationSettings {
  id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  email_recipients: string[];
  sms_recipients: string[];
  overdue_threshold_days: number;
  reminder_advance_days: number;
  notification_frequency: string;
}

interface ComplianceAlert {
  id: string;
  vehicle_id: string;
  alert_type: string;
  alert_level: string;
  message: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
  resolved_at?: string;
}

export const SpillKitNotificationManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [newEmailRecipient, setNewEmailRecipient] = useState("");
  const [newSmsRecipient, setNewSmsRecipient] = useState("");

  // Fetch notification settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["spill-kit-notification-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spill_kit_notification_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as NotificationSettings | null;
    }
  });

  // Fetch active alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["spill-kit-compliance-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spill_kit_compliance_alerts")
        .select(`
          *,
          vehicles!inner(license_plate)
        `)
        .eq("acknowledged", false)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as (ComplianceAlert & { vehicles: { license_plate: string } })[];
    }
  });

  // Create/update notification settings
  const { mutate: updateSettings } = useMutation({
    mutationFn: async (newSettings: Partial<NotificationSettings>) => {
      if (settings?.id) {
        const { error } = await supabase
          .from("spill_kit_notification_settings")
          .update(newSettings)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("spill_kit_notification_settings")
          .insert([newSettings]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spill-kit-notification-settings"] });
      toast({
        title: "Settings Updated",
        description: "Notification settings have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive"
      });
    }
  });

  // Acknowledge alert
  const { mutate: acknowledgeAlert } = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("spill_kit_compliance_alerts")
        .update({
          acknowledged: true,
          acknowledged_by: "current_user", // In real app, use actual user ID
          acknowledged_at: new Date().toISOString()
        })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spill-kit-compliance-alerts"] });
      toast({
        title: "Alert Acknowledged",
        description: "Alert has been marked as acknowledged.",
      });
    }
  });

  const addEmailRecipient = () => {
    if (!newEmailRecipient || !newEmailRecipient.includes("@")) return;
    
    const currentRecipients = settings?.email_recipients || [];
    if (currentRecipients.includes(newEmailRecipient)) return;

    updateSettings({
      email_recipients: [...currentRecipients, newEmailRecipient]
    });
    setNewEmailRecipient("");
  };

  const removeEmailRecipient = (email: string) => {
    const currentRecipients = settings?.email_recipients || [];
    updateSettings({
      email_recipients: currentRecipients.filter(r => r !== email)
    });
  };

  const addSmsRecipient = () => {
    if (!newSmsRecipient) return;
    
    const currentRecipients = settings?.sms_recipients || [];
    if (currentRecipients.includes(newSmsRecipient)) return;

    updateSettings({
      sms_recipients: [...currentRecipients, newSmsRecipient]
    });
    setNewSmsRecipient("");
  };

  const removeSmsRecipient = (phone: string) => {
    const currentRecipients = settings?.sms_recipients || [];
    updateSettings({
      sms_recipients: currentRecipients.filter(r => r !== phone)
    });
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case "critical": return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "warning": return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const getAlertBadgeVariant = (level: string) => {
    switch (level) {
      case "critical": return "destructive";
      case "warning": return "secondary";
      default: return "outline";
    }
  };

  if (settingsLoading || alertsLoading) {
    return <div className="py-10 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Notification Management</h2>
          <p className="text-muted-foreground">Configure alerts and notifications for spill kit compliance</p>
        </div>
        <Settings className="h-6 w-6 text-muted-foreground" />
      </div>

      {/* Active Alerts */}
      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.alert_level)}
                    <div>
                      <div className="font-medium">{alert.vehicles.license_plate}</div>
                      <div className="text-sm text-muted-foreground">{alert.message}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getAlertBadgeVariant(alert.alert_level)}>
                      {alert.alert_level}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Acknowledge
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-enabled">Enable Email Notifications</Label>
              <Switch
                id="email-enabled"
                checked={settings?.email_notifications || false}
                onCheckedChange={(checked) => updateSettings({ email_notifications: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Email Recipients</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={newEmailRecipient}
                  onChange={(e) => setNewEmailRecipient(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addEmailRecipient()}
                />
                <Button onClick={addEmailRecipient}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(settings?.email_recipients || []).map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeEmailRecipient(email)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              SMS Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-enabled">Enable SMS Notifications</Label>
              <Switch
                id="sms-enabled"
                checked={settings?.sms_notifications || false}
                onCheckedChange={(checked) => updateSettings({ sms_notifications: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>SMS Recipients</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter phone number"
                  value={newSmsRecipient}
                  onChange={(e) => setNewSmsRecipient(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addSmsRecipient()}
                />
                <Button onClick={addSmsRecipient}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(settings?.sms_recipients || []).map((phone) => (
                  <Badge key={phone} variant="secondary" className="gap-1">
                    {phone}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeSmsRecipient(phone)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Thresholds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="overdue-threshold">Overdue Threshold (Days)</Label>
              <Input
                id="overdue-threshold"
                type="number"
                value={settings?.overdue_threshold_days || 30}
                onChange={(e) => updateSettings({ overdue_threshold_days: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder-advance">Reminder Advance (Days)</Label>
              <Input
                id="reminder-advance"
                type="number"
                value={settings?.reminder_advance_days || 7}
                onChange={(e) => updateSettings({ reminder_advance_days: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-frequency">Notification Frequency</Label>
              <Select 
                value={settings?.notification_frequency || "daily"}
                onValueChange={(value) => updateSettings({ notification_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="immediately">Immediate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};