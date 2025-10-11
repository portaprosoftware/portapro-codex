import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelectVehicleFilter } from '../MultiSelectVehicleFilter';
import { MultiSelectDriverFilter } from '../MultiSelectDriverFilter';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Vehicle {
  id: string;
  license_plate: string | null;
}

interface Driver {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  clerk_user_id: string | null;
}

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
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<Driver[]>([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
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
        const vehicleIds = selectedVehicles.map(v => v.id);
        query = query.in('vehicle_id', vehicleIds);
      }

      // Apply driver filter
      if (selectedDrivers.length > 0) {
        const driverIds = selectedDrivers.map(d => d.id);
        query = query.in('driver_id', driverIds);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      if (exportFormat === 'csv') {
        exportToCSV(data);
      } else {
        exportToPDF(data);
      }

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
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Fuel Logs Export', 14, 20);
    
    // Add date range if specified
    if (dateRange?.from || dateRange?.to) {
      doc.setFontSize(10);
      const dateText = `Date Range: ${dateRange?.from ? dateRange.from.toLocaleDateString() : 'Start'} - ${dateRange?.to ? dateRange.to.toLocaleDateString() : 'End'}`;
      doc.text(dateText, 14, 28);
    }
    
    // Prepare table headers based on selected columns
    const headers = [];
    if (includeColumns.date) headers.push('Date');
    if (includeColumns.vehicle) headers.push('Vehicle');
    if (includeColumns.driver) headers.push('Driver');
    if (includeColumns.odometer) headers.push('Odometer');
    if (includeColumns.gallons) headers.push('Gallons');
    if (includeColumns.cost_per_gallon) headers.push('$/Gal');
    if (includeColumns.total_cost) headers.push('Total Cost');
    if (includeColumns.station) headers.push('Station');
    if (includeColumns.notes) headers.push('Notes');
    
    // Prepare table rows
    const rows = data.map(row => {
      const rowData = [];
      if (includeColumns.date) rowData.push(row.log_date);
      if (includeColumns.vehicle) rowData.push(row.vehicle?.license_plate || 'N/A');
      if (includeColumns.driver) rowData.push(row.driver ? `${row.driver.first_name} ${row.driver.last_name}` : 'N/A');
      if (includeColumns.odometer) rowData.push(row.odometer_reading?.toString() || '0');
      if (includeColumns.gallons) rowData.push(row.gallons_purchased?.toString() || '0');
      if (includeColumns.cost_per_gallon) rowData.push(`$${parseFloat(row.cost_per_gallon || 0).toFixed(2)}`);
      if (includeColumns.total_cost) rowData.push(`$${parseFloat(row.total_cost || 0).toFixed(2)}`);
      if (includeColumns.station) rowData.push(row.fuel_station || 'N/A');
      if (includeColumns.notes) rowData.push(row.notes || '');
      return rowData;
    });
    
    // Add table to PDF
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: dateRange?.from || dateRange?.to ? 32 : 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }, // Blue header
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    
    // Save the PDF
    const filename = `fuel_logs_export_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    toast({
      title: 'Success',
      description: 'PDF exported successfully'
    });
  };


  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle>Export Fuel Data</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsVehicleModalOpen(true)}
                      className="w-full justify-start mt-2 h-9"
                    >
                      {selectedVehicles.length === 0
                        ? 'All vehicles'
                        : `${selectedVehicles.length} selected`}
                    </Button>
                  </div>

                  <div>
                    <Label>Drivers (Optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDriverModalOpen(true)}
                      className="w-full justify-start mt-2 h-9"
                    >
                      {selectedDrivers.length === 0
                        ? 'All drivers'
                        : `${selectedDrivers.length} selected`}
                    </Button>
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

          <div className="flex justify-end gap-2 pt-4 border-t mt-4 bg-white sticky bottom-0 px-4 pb-4">
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
        </div>
      </DrawerContent>

      {/* Vehicle Multi-Select Modal */}
      <MultiSelectVehicleFilter
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
        selectedVehicles={selectedVehicles}
        onVehiclesChange={setSelectedVehicles}
      />

      {/* Driver Multi-Select Modal */}
      <MultiSelectDriverFilter
        open={isDriverModalOpen}
        onOpenChange={setIsDriverModalOpen}
        selectedDrivers={selectedDrivers}
        onDriversChange={setSelectedDrivers}
      />
    </Drawer>
  );
};