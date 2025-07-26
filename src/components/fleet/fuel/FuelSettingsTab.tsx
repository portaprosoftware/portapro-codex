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
import { Save, Plus, Trash2, MapPin } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AddFuelStationModal } from './AddFuelStationModal';

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

interface FuelStation {
  id: string;
  name: string;
  address: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  default_cost_per_gallon: number;
  phone: string;
  is_active: boolean;
  notes: string;
}

export const FuelSettingsTab: React.FC = () => {
  const [showAddStationModal, setShowAddStationModal] = useState(false);
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

  // Fetch fuel stations
  const { data: stations, isLoading: stationsLoading } = useQuery({
    queryKey: ['fuel-stations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_stations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as FuelStation[];
    }
  });

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

  const deleteStationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fuel_stations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Fuel station deleted successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['fuel-stations'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete fuel station',
        variant: 'destructive'
      });
    }
  });

  const handleSaveSettings = () => {
    if (settings) {
      updateSettingsMutation.mutate(settings);
    }
  };

  const handleDeleteStation = async (id: string) => {
    if (confirm('Are you sure you want to delete this fuel station?')) {
      deleteStationMutation.mutate(id);
    }
  };

  if (settingsLoading || stationsLoading) {
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
                value={settings?.fuel_unit || 'gallons'} 
                onValueChange={(value) => settings && Object.assign(settings, { fuel_unit: value })}
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
                value={settings?.currency_format || 'USD'} 
                onValueChange={(value) => settings && Object.assign(settings, { currency_format: value })}
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
                value={settings?.odometer_precision?.toString() || '0'} 
                onValueChange={(value) => settings && Object.assign(settings, { odometer_precision: parseInt(value) })}
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
                value={settings?.manager_approval_threshold || ''}
                onChange={(e) => settings && Object.assign(settings, { manager_approval_threshold: parseFloat(e.target.value) })}
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
              checked={settings?.require_receipt || false}
              onCheckedChange={(checked) => settings && Object.assign(settings, { require_receipt: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="driver-edit">Allow Driver Editing</Label>
              <p className="text-sm text-muted-foreground">Let drivers edit their fuel logs</p>
            </div>
            <Switch
              id="driver-edit"
              checked={settings?.driver_edit_permission || false}
              onCheckedChange={(checked) => settings && Object.assign(settings, { driver_edit_permission: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-mpg">Auto-Calculate MPG</Label>
              <p className="text-sm text-muted-foreground">Automatically calculate MPG from odometer readings</p>
            </div>
            <Switch
              id="auto-mpg"
              checked={settings?.auto_calculate_mpg || false}
              onCheckedChange={(checked) => settings && Object.assign(settings, { auto_calculate_mpg: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Fuel Stations Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fuel Stations</CardTitle>
            <Button onClick={() => setShowAddStationModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Station
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Default $/Gal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stations && stations.length > 0 ? (
                  stations.map((station) => (
                    <TableRow key={station.id}>
                      <TableCell className="font-medium">{station.name}</TableCell>
                      <TableCell>
                        {station.address || `${station.street}, ${station.city}, ${station.state} ${station.zip}`}
                      </TableCell>
                      <TableCell>{station.phone || 'N/A'}</TableCell>
                      <TableCell>
                        {station.default_cost_per_gallon ? `$${station.default_cost_per_gallon.toFixed(3)}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={station.is_active ? 'default' : 'secondary'}>
                          {station.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteStation(station.id)}
                          disabled={deleteStationMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No fuel stations configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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

      {/* Modals */}
      <AddFuelStationModal 
        open={showAddStationModal} 
        onOpenChange={setShowAddStationModal} 
      />
    </div>
  );
};