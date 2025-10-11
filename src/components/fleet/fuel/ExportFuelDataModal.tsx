import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface ExportFuelDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExportFuelDataModal: React.FC<ExportFuelDataModalProps> = ({
  open,
  onOpenChange
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [includeColumns, setIncludeColumns] = useState({
    date: true,
    vehicle: true,
    driver: true,
    odometer: true,
    gallons: true,
    cost_per_gallon: true,
    total_cost: true,
    station: true,
    notes: false
  });

  const { toast } = useToast();

  // Fetch vehicles for filter
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate')
        .eq('status', 'active')
        .order('license_plate');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch drivers for filter
  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('is_active', true)
        .order('first_name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleExport = async () => {
    try {
      // Build query based on filters
      let query = supabase
        .from('fuel_logs')
        .select(`
          log_date,
          odometer_reading,
          gallons_purchased,
          cost_per_gallon,
          total_cost,
          fuel_station,
          notes,
          vehicle:vehicles(license_plate),
          driver:profiles(first_name, last_name)
        `)
        .order('log_date', { ascending: false });

      // Apply date range filter
      if (dateRange?.from) {
        query = query.gte('log_date', dateRange.from.toISOString().split('T')[0]);
      }
      if (dateRange?.to) {
        query = query.lte('log_date', dateRange.to.toISOString().split('T')[0]);
      }

      // Apply vehicle filter
      if (selectedVehicles.length > 0) {
        query = query.in('vehicle_id', selectedVehicles);
      }

      // Apply driver filter
      if (selectedDrivers.length > 0) {
        query = query.in('driver_id', selectedDrivers);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      if (exportFormat === 'csv') {
        exportToCSV(data);
      } else {
        exportToPDF(data);
      }

      toast({
        title: 'Success',
        description: `Data exported successfully as ${exportFormat.toUpperCase()}`
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive'
      });
      console.error('Export error:', error);
    }
  };

  const exportToCSV = (data: any[]) => {
    const headers = [];
    if (includeColumns.date) headers.push('Date');
    if (includeColumns.vehicle) headers.push('Vehicle');
    if (includeColumns.driver) headers.push('Driver');
    if (includeColumns.odometer) headers.push('Odometer');
    if (includeColumns.gallons) headers.push('Gallons');
    if (includeColumns.cost_per_gallon) headers.push('Cost Per Gallon');
    if (includeColumns.total_cost) headers.push('Total Cost');
    if (includeColumns.station) headers.push('Station');
    if (includeColumns.notes) headers.push('Notes');

    const rows = data.map(row => {
      const csvRow = [];
      if (includeColumns.date) csvRow.push(row.log_date);
      if (includeColumns.vehicle) csvRow.push(row.vehicle?.license_plate || '');
      if (includeColumns.driver) csvRow.push(row.driver ? `${row.driver.first_name} ${row.driver.last_name}` : '');
      if (includeColumns.odometer) csvRow.push(row.odometer_reading);
      if (includeColumns.gallons) csvRow.push(row.gallons_purchased);
      if (includeColumns.cost_per_gallon) csvRow.push(row.cost_per_gallon);
      if (includeColumns.total_cost) csvRow.push(row.total_cost);
      if (includeColumns.station) csvRow.push(row.fuel_station || '');
      if (includeColumns.notes) csvRow.push(row.notes || '');
      return csvRow;
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fuel_logs_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = (data: any[]) => {
    // For PDF export, you would typically use a library like jsPDF
    // For now, we'll just show a placeholder
    toast({
      title: 'PDF Export',
      description: 'PDF export functionality would be implemented here',
    });
  };

  const toggleVehicle = (vehicleId: string) => {
    setSelectedVehicles(prev =>
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const toggleDriver = (driverId: string) => {
    setSelectedDrivers(prev =>
      prev.includes(driverId)
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Fuel Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    exportFormat === 'csv' ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                  onClick={() => setExportFormat('csv')}
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium">CSV</p>
                      <p className="text-sm text-muted-foreground">Spreadsheet format</p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    exportFormat === 'pdf' ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                  onClick={() => setExportFormat('pdf')}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="font-medium">PDF</p>
                      <p className="text-sm text-muted-foreground">Document format</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Date Range</Label>
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={setDateRange}
                  placeholder="Select date range (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vehicles (Optional)</Label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {vehicles?.map((vehicle) => (
                      <div key={vehicle.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={vehicle.id}
                          checked={selectedVehicles.includes(vehicle.id)}
                          onCheckedChange={() => toggleVehicle(vehicle.id)}
                        />
                        <Label htmlFor={vehicle.id} className="text-sm">
                          {vehicle.license_plate}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Drivers (Optional)</Label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {drivers?.map((driver) => (
                      <div key={driver.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={driver.id}
                          checked={selectedDrivers.includes(driver.id)}
                          onCheckedChange={() => toggleDriver(driver.id)}
                        />
                        <Label htmlFor={driver.id} className="text-sm">
                          {driver.first_name} {driver.last_name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Column Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Columns to Include</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(includeColumns).map(([key, checked]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={checked}
                      onCheckedChange={(newChecked) =>
                        setIncludeColumns(prev => ({ ...prev, [key]: newChecked }))
                      }
                    />
                    <Label htmlFor={key} className="text-sm capitalize">
                      {key.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            className="bg-gradient-to-r from-primary to-primary-variant"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};