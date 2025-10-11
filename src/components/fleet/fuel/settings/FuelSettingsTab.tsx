import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Settings, 
  Fuel, 
  Bell, 
  Calculator, 
  Shield,
  Save
} from 'lucide-react';
import { useFuelManagementSettings, useUpdateFuelManagementSettings } from '@/hooks/useFuelManagementSettings';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const FuelSettingsTab: React.FC = () => {
  const { data: settings, isLoading } = useFuelManagementSettings();
  const updateSettings = useUpdateFuelManagementSettings();
  const [localSettings, setLocalSettings] = useState(settings);

  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = () => {
    if (localSettings) {
      updateSettings.mutate(localSettings);
    }
  };

  if (isLoading || !localSettings) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Fuel Management Settings
          </h2>
          <p className="text-muted-foreground">Configure fuel tracking, alerts, and integrations</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          These settings affect all fuel tracking across your entire fleet. Changes take effect immediately.
        </AlertDescription>
      </Alert>

      {/* Fuel Source Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Fuel className="h-5 w-5" />
            Fuel Source Controls
          </CardTitle>
          <CardDescription>
            Enable or disable specific fuel sources for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="space-y-0.5">
                <Label htmlFor="retail-enabled">Retail Stations</Label>
                <p className="text-sm text-muted-foreground">Commercial gas stations</p>
              </div>
              <Switch
                id="retail-enabled"
                checked={localSettings.retail_enabled}
                onCheckedChange={(checked) => 
                  setLocalSettings({ ...localSettings, retail_enabled: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <div className="space-y-0.5">
                <Label htmlFor="yard-tank-enabled">Yard Tanks</Label>
                <p className="text-sm text-muted-foreground">On-site fuel storage</p>
              </div>
              <Switch
                id="yard-tank-enabled"
                checked={localSettings.yard_tank_enabled}
                onCheckedChange={(checked) => 
                  setLocalSettings({ ...localSettings, yard_tank_enabled: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <div className="space-y-0.5">
                <Label htmlFor="mobile-service-enabled">Mobile Service</Label>
                <p className="text-sm text-muted-foreground">Fuel delivery trucks</p>
              </div>
              <Switch
                id="mobile-service-enabled"
                checked={localSettings.mobile_service_enabled}
                onCheckedChange={(checked) => 
                  setLocalSettings({ ...localSettings, mobile_service_enabled: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Alert Thresholds
          </CardTitle>
          <CardDescription>
            Configure when the system should trigger alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tank-low">Tank Low Level (%)</Label>
              <Input
                id="tank-low"
                type="number"
                min="0"
                max="100"
                value={localSettings.tank_low_threshold_percent}
                onChange={(e) => 
                  setLocalSettings({ 
                    ...localSettings, 
                    tank_low_threshold_percent: parseFloat(e.target.value) 
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Alert when tank level drops below this percentage
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tank-critical">Tank Critical Level (%)</Label>
              <Input
                id="tank-critical"
                type="number"
                min="0"
                max="100"
                value={localSettings.tank_critical_threshold_percent}
                onChange={(e) => 
                  setLocalSettings({ 
                    ...localSettings, 
                    tank_critical_threshold_percent: parseFloat(e.target.value) 
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Critical alert for extremely low tank levels
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumption-threshold">Unusual Consumption (%)</Label>
              <Input
                id="consumption-threshold"
                type="number"
                min="100"
                max="300"
                value={localSettings.unusual_consumption_threshold_percent}
                onChange={(e) => 
                  setLocalSettings({ 
                    ...localSettings, 
                    unusual_consumption_threshold_percent: parseFloat(e.target.value) 
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Flag consumption above this % of average (e.g., 150 = 50% over normal)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price-spike">Price Spike Alert (%)</Label>
              <Input
                id="price-spike"
                type="number"
                min="0"
                max="100"
                value={localSettings.price_spike_threshold_percent}
                onChange={(e) => 
                  setLocalSettings({ 
                    ...localSettings, 
                    price_spike_threshold_percent: parseFloat(e.target.value) 
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Alert when fuel prices spike above this % of average
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Calculation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5" />
            Auto-Calculation Rules
          </CardTitle>
          <CardDescription>
            Enable automatic calculations and data analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="auto-mpg">Auto-Calculate MPG</Label>
                <p className="text-sm text-muted-foreground">Calculate miles per gallon automatically</p>
              </div>
              <Switch
                id="auto-mpg"
                checked={localSettings.auto_calculate_mpg}
                onCheckedChange={(checked) => 
                  setLocalSettings({ ...localSettings, auto_calculate_mpg: checked })
                }
              />
            </div>

            <div className="flex items-start gap-3">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="auto-cost-per-mile">Auto-Calculate Cost/Mile</Label>
                <p className="text-sm text-muted-foreground">Track fuel cost per mile driven</p>
              </div>
              <Switch
                id="auto-cost-per-mile"
                checked={localSettings.auto_calculate_cost_per_mile}
                onCheckedChange={(checked) => 
                  setLocalSettings({ ...localSettings, auto_calculate_cost_per_mile: checked })
                }
              />
            </div>

            <div className="flex items-start gap-3">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="auto-flag-consumption">Auto-Flag High Consumption</Label>
                <p className="text-sm text-muted-foreground">Automatically detect unusual usage</p>
              </div>
              <Switch
                id="auto-flag-consumption"
                checked={localSettings.auto_flag_high_consumption}
                onCheckedChange={(checked) => 
                  setLocalSettings({ ...localSettings, auto_flag_high_consumption: checked })
                }
              />
            </div>

            <div className="flex items-start gap-3">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="auto-flag-prices">Auto-Flag Price Spikes</Label>
                <p className="text-sm text-muted-foreground">Alert on unusually high fuel prices</p>
              </div>
              <Switch
                id="auto-flag-prices"
                checked={localSettings.auto_flag_price_spikes}
                onCheckedChange={(checked) => 
                  setLocalSettings({ ...localSettings, auto_flag_price_spikes: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Integration & Automation
          </CardTitle>
          <CardDescription>
            Configure automatic updates and data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="auto-update-tanks">Auto-Update Tank Levels</Label>
              <p className="text-sm text-muted-foreground">
                Automatically adjust tank levels based on deliveries and fuel draws
              </p>
            </div>
            <Switch
              id="auto-update-tanks"
              checked={localSettings.auto_update_tank_levels}
              onCheckedChange={(checked) => 
                setLocalSettings({ ...localSettings, auto_update_tank_levels: checked })
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="variance-tolerance">Variance Tolerance (%)</Label>
            <Input
              id="variance-tolerance"
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={localSettings.variance_tolerance_percent}
              onChange={(e) => 
                setLocalSettings({ 
                  ...localSettings, 
                  variance_tolerance_percent: parseFloat(e.target.value) 
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Acceptable variance between calculated and actual tank levels (5% = ±5 gallons per 100 gal)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure how and when you receive alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="notifications-enabled">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">Master switch for all notifications</p>
            </div>
            <Switch
              id="notifications-enabled"
              checked={localSettings.notifications_enabled}
              onCheckedChange={(checked) => 
                setLocalSettings({ ...localSettings, notifications_enabled: checked })
              }
            />
          </div>

          {localSettings.notifications_enabled && (
            <>
              <Separator />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send alerts via email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={localSettings.email_notifications}
                    onCheckedChange={(checked) => 
                      setLocalSettings({ ...localSettings, email_notifications: checked })
                    }
                  />
                </div>

                <div className="flex items-start gap-3">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send alerts via text message</p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={localSettings.sms_notifications}
                    onCheckedChange={(checked) => 
                      setLocalSettings({ ...localSettings, sms_notifications: checked })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="notification-email">Notification Email</Label>
                  <Input
                    id="notification-email"
                    type="email"
                    placeholder="alerts@company.com"
                    value={localSettings.notification_email || ''}
                    onChange={(e) => 
                      setLocalSettings({ ...localSettings, notification_email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification-phone">Notification Phone</Label>
                  <Input
                    id="notification-phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={localSettings.notification_phone || ''}
                    onChange={(e) => 
                      setLocalSettings({ ...localSettings, notification_phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-frequency">Notification Frequency</Label>
                <Select
                  value={localSettings.notification_frequency}
                  onValueChange={(value: any) => 
                    setLocalSettings({ ...localSettings, notification_frequency: value })
                  }
                >
                  <SelectTrigger id="notification-frequency" className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  How often to receive non-critical alerts
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* SPCC Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            SPCC Compliance
          </CardTitle>
          <CardDescription>
            Spill Prevention, Control, and Countermeasure regulations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="spcc-enabled">Enable SPCC Compliance Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Track and monitor tanks that require SPCC compliance
              </p>
            </div>
            <Switch
              id="spcc-enabled"
              checked={localSettings.spcc_compliance_enabled}
              onCheckedChange={(checked) => 
                setLocalSettings({ ...localSettings, spcc_compliance_enabled: checked })
              }
            />
          </div>

          {localSettings.spcc_compliance_enabled && (
            <>
              <Separator />

              <div className="space-y-2">
                <Label htmlFor="spcc-threshold">SPCC Tank Threshold (Gallons)</Label>
                <Input
                  id="spcc-threshold"
                  type="number"
                  min="0"
                  step="1"
                  value={localSettings.spcc_tank_threshold_gallons}
                  onChange={(e) => 
                    setLocalSettings({ 
                      ...localSettings, 
                      spcc_tank_threshold_gallons: parseFloat(e.target.value) 
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Federal regulation requires SPCC plans for tanks ≥1,320 gallons
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button (bottom) */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
};
