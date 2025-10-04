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
import { Save, Plus, Edit, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StateScroller } from '@/components/ui/state-scroller';

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
  const [showStationModal, setShowStationModal] = useState(false);
  const [editingStation, setEditingStation] = useState<any>(null);
  const [stationFormData, setStationFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });
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

  // Fetch fuel stations
  const { data: fuelStations = [], isLoading: stationsLoading } = useQuery({
    queryKey: ['fuel-stations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_stations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const addStationMutation = useMutation({
    mutationFn: async (stationData: any) => {
      if (editingStation) {
        const { error } = await supabase
          .from('fuel_stations')
          .update(stationData)
          .eq('id', editingStation.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fuel_stations')
          .insert(stationData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: editingStation ? 'Station updated successfully' : 'Station added successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['fuel-stations'] });
      setShowStationModal(false);
      setEditingStation(null);
      setStationFormData({ name: '', address: '', city: '', state: '', zip: '' });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save station',
        variant: 'destructive'
      });
    }
  });

  const deleteStationMutation = useMutation({
    mutationFn: async (stationId: string) => {
      const { error } = await supabase
        .from('fuel_stations')
        .delete()
        .eq('id', stationId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Station deleted successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['fuel-stations'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete station',
        variant: 'destructive'
      });
    }
  });

  const handleEditStation = (station: any) => {
    setEditingStation(station);
    setStationFormData({
      name: station.name || '',
      address: station.address || '',
      city: station.city || '',
      state: station.state || '',
      zip: station.zip || ''
    });
    setShowStationModal(true);
  };

  const handleAddStation = () => {
    setEditingStation(null);
    setStationFormData({ name: '', address: '', city: '', state: '', zip: '' });
    setShowStationModal(true);
  };

  const handleSaveStation = () => {
    if (!stationFormData.name) {
      toast({
        title: 'Validation Error',
        description: 'Station name is required',
        variant: 'destructive'
      });
      return;
    }
    addStationMutation.mutate(stationFormData);
  };


  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<FuelSettings>) => {
      // Add minimum loading duration to prevent flash
      const [result] = await Promise.all([
        (async () => {
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
        })(),
        // Minimum 600ms loading time
        new Promise(resolve => setTimeout(resolve, 600))
      ]);
      return result;
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

      {/* Fuel Stations Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fuel Stations</CardTitle>
            <Button onClick={handleAddStation} size="sm" className="bg-gradient-to-r from-primary to-primary-variant">
              <Plus className="h-4 w-4 mr-2" />
              Add Station
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stationsLoading ? (
            <LoadingSpinner />
          ) : fuelStations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Zip</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelStations.map((station: any) => (
                  <TableRow key={station.id}>
                    <TableCell className="font-medium">{station.name}</TableCell>
                    <TableCell>{station.address || '-'}</TableCell>
                    <TableCell>{station.city || '-'}</TableCell>
                    <TableCell>{station.state || '-'}</TableCell>
                    <TableCell>{station.zip || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStation(station)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteStationMutation.mutate(station.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No fuel stations found. Add your first station to get started.
            </div>
          )}
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

      {/* Add/Edit Station Modal */}
      <Dialog open={showStationModal} onOpenChange={setShowStationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStation ? 'Edit Fuel Station' : 'Add Fuel Station'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="station-name">Station Name *</Label>
              <Input
                id="station-name"
                value={stationFormData.name}
                onChange={(e) => setStationFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Shell, Chevron, BP"
              />
            </div>
            <div>
              <Label htmlFor="station-address">Address</Label>
              <Input
                id="station-address"
                value={stationFormData.address}
                onChange={(e) => setStationFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="station-city">City</Label>
                <Input
                  id="station-city"
                  value={stationFormData.city}
                  onChange={(e) => setStationFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="station-state">State</Label>
                <StateScroller
                  value={stationFormData.state}
                  onValueChange={(value) => setStationFormData(prev => ({ ...prev, state: value }))}
                  placeholder="State"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="station-zip">Zip Code</Label>
              <Input
                id="station-zip"
                value={stationFormData.zip}
                onChange={(e) => setStationFormData(prev => ({ ...prev, zip: e.target.value }))}
                placeholder="Zip code"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStationModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveStation}
              disabled={addStationMutation.isPending}
              className="bg-gradient-to-r from-primary to-primary-variant"
            >
              {addStationMutation.isPending ? 'Saving...' : 'Save Station'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};