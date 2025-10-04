import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface FuelSettings {
  id: string;
  fuel_unit: string;
  currency_format: string;
  odometer_precision: number;
  require_receipt: boolean;
  driver_edit_permission: boolean;
  manager_approval_threshold: number;
  auto_calculate_mpg: boolean;
  default_fuel_station_id: string;
}

export const FuelSettingsTab: React.FC = () => {
  const [localSettings, setLocalSettings] = useState<Partial<FuelSettings>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch fuel settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['fuel-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as FuelSettings;
    }
  });

  // Initialize local settings when data loads
  React.useEffect(() => {
    if (settings && Object.keys(localSettings).length === 0) {
      setLocalSettings(settings);
    }
  }, [settings, localSettings]);


  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<FuelSettings>) => {
      if (settings?.id) {
        const { error } = await supabase
          .from('fuel_settings')
          .update(newSettings)
          .eq('id', settings.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fuel_settings')
          .insert(newSettings);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Settings updated successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['fuel-settings'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive'
      });
    }
  });


  const handleSaveSettings = () => {
    if (localSettings && Object.keys(localSettings).length > 0) {
      updateSettingsMutation.mutate(localSettings);
    }
  };

  if (settingsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Default Units & Formats */}
      <Card>
        <CardHeader>
          <CardTitle>Default Units & Formats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fuel-unit">Fuel Unit</Label>
              <Select 
                value={localSettings?.fuel_unit || 'gallons'} 
                onValueChange={(value) => setLocalSettings(prev => ({ ...prev, fuel_unit: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gallons">Gallons (US)</SelectItem>
                  <SelectItem value="liters">Liters</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="currency">Currency Format</Label>
              <Select 
                value={localSettings?.currency_format || 'USD'} 
                onValueChange={(value) => setLocalSettings(prev => ({ ...prev, currency_format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="odometer-precision">Odometer Precision</Label>
              <Select 
                value={localSettings?.odometer_precision?.toString() || '0'} 
                onValueChange={(value) => setLocalSettings(prev => ({ ...prev, odometer_precision: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Whole numbers</SelectItem>
                  <SelectItem value="1">One decimal place</SelectItem>
                  <SelectItem value="2">Two decimal places</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="approval-threshold">Manager Approval Threshold ($)</Label>
              <Input
                id="approval-threshold"
                type="number"
                step="0.01"
                value={localSettings?.manager_approval_threshold || ''}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, manager_approval_threshold: parseFloat(e.target.value) }))}
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="require-receipt">Require Receipt Upload</Label>
              <p className="text-sm text-muted-foreground">Force drivers to upload receipt photos</p>
            </div>
            <Switch
              id="require-receipt"
              checked={localSettings?.require_receipt || false}
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, require_receipt: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="driver-edit">Allow Driver Editing</Label>
              <p className="text-sm text-muted-foreground">Let drivers edit their fuel logs</p>
            </div>
            <Switch
              id="driver-edit"
              checked={localSettings?.driver_edit_permission || false}
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, driver_edit_permission: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-mpg">Auto-Calculate MPG</Label>
              <p className="text-sm text-muted-foreground">Automatically calculate MPG from odometer readings</p>
            </div>
            <Switch
              id="auto-mpg"
              checked={localSettings?.auto_calculate_mpg || false}
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, auto_calculate_mpg: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Settings Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={updateSettingsMutation.isPending}
          className="bg-gradient-to-r from-primary to-primary-variant"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};