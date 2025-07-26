import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileDown, Calendar, Filter, Download } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

interface ExportMaintenanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportMaintenanceModal({ open, onOpenChange }: ExportMaintenanceModalProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -90),
    to: new Date()
  });
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includePhotos, setIncludePhotos] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);

  // Fetch vehicles for filtering
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-for-export'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, make, model')
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Export maintenance data mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const startDate = dateRange?.from?.toISOString().split('T')[0];
      const endDate = dateRange?.to?.toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('export_maintenance_data', {
        start_date: startDate,
        end_date: endDate,
        vehicle_ids: selectedVehicles.length > 0 ? selectedVehicles : null,
        export_format: 'detailed'
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Convert JSON data to CSV or trigger PDF generation
      if (exportFormat === 'csv') {
        downloadAsCSV(data);
      } else {
        downloadAsPDF(data);
      }
      toast.success("Export completed successfully");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Export failed: ${error.message}`);
    }
  });

  const downloadAsCSV = (data: any) => {
    const records = data.records || [];
    if (records.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Create CSV headers
    const headers = [
      'Date',
      'Vehicle',
      'Maintenance Type',
      'Description',
      'Status',
      'Priority',
      'Parts Cost',
      'Labor Cost',
      'Total Cost',
      'Technician',
      'Vendor',
      'Mileage',
      'Notes'
    ];

    // Convert records to CSV rows
    const csvRows = records.map((record: any) => [
      record.completed_date || record.scheduled_date,
      `${record.vehicle_info?.license_plate} (${record.vehicle_info?.make} ${record.vehicle_info?.model})`,
      record.maintenance_type,
      record.description,
      record.status,
      record.priority,
      record.costs?.parts_cost || 0,
      record.costs?.labor_cost || 0,
      record.costs?.total_cost || 0,
      record.technician_name || 'Not Assigned',
      record.vendor_name || 'N/A',
      record.service_details?.mileage_at_service || 'N/A',
      record.notes || ''
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maintenance-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadAsPDF = (data: any) => {
    // For now, we'll create a simple HTML report and let the browser handle PDF generation
    const reportHTML = generateHTMLReport(data);
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(reportHTML);
      newWindow.document.close();
      newWindow.print();
    }
  };

  const generateHTMLReport = (data: any) => {
    const summary = data.summary || {};
    const records = data.records || [];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Maintenance Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
          .summary-item { display: inline-block; margin-right: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .cost { text-align: right; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Fleet Maintenance Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          <p>Period: ${dateRange?.from?.toLocaleDateString()} - ${dateRange?.to?.toLocaleDateString()}</p>
        </div>
        
        ${includeSummary ? `
        <div class="summary">
          <h2>Summary</h2>
          <div class="summary-item"><strong>Total Records:</strong> ${summary.total_records || 0}</div>
          <div class="summary-item"><strong>Total Cost:</strong> $${(summary.total_cost || 0).toLocaleString()}</div>
          <div class="summary-item"><strong>Average Cost:</strong> $${(summary.average_cost || 0).toFixed(2)}</div>
        </div>
        ` : ''}
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Vehicle</th>
              <th>Type</th>
              <th>Status</th>
              <th>Cost</th>
              <th>Technician</th>
            </tr>
          </thead>
          <tbody>
            ${records.map((record: any) => `
              <tr>
                <td>${new Date(record.completed_date || record.scheduled_date).toLocaleDateString()}</td>
                <td>${record.vehicle_info?.license_plate}</td>
                <td>${record.maintenance_type}</td>
                <td>${record.status}</td>
                <td class="cost">$${(record.costs?.total_cost || 0).toFixed(2)}</td>
                <td>${record.technician_name || 'Not Assigned'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  const handleVehicleToggle = (vehicleId: string, checked: boolean) => {
    if (checked) {
      setSelectedVehicles(prev => [...prev, vehicleId]);
    } else {
      setSelectedVehicles(prev => prev.filter(id => id !== vehicleId));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5" />
            Export Maintenance Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Date Range</Label>
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
              className="w-full"
            />
          </div>

          {/* Export Format */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'pdf') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Excel Compatible)</SelectItem>
                <SelectItem value="pdf">PDF Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Options */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Export Options</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-summary"
                  checked={includeSummary}
                  onCheckedChange={(checked) => setIncludeSummary(checked === true)}
                />
                <Label htmlFor="include-summary">Include summary statistics</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-photos"
                  checked={includePhotos}
                  onCheckedChange={(checked) => setIncludePhotos(checked === true)}
                />
                <Label htmlFor="include-photos">Include service photos (PDF only)</Label>
              </div>
            </div>
          </div>

          {/* Vehicle Filter */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Filter by Vehicles (Optional)</Label>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`vehicle-${vehicle.id}`}
                    checked={selectedVehicles.includes(vehicle.id)}
                    onCheckedChange={(checked) => handleVehicleToggle(vehicle.id, checked === true)}
                  />
                  <Label htmlFor={`vehicle-${vehicle.id}`} className="text-sm">
                    {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                  </Label>
                </div>
              ))}
            </div>
            {selectedVehicles.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {selectedVehicles.length} vehicle(s) selected
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending || !dateRange?.from || !dateRange?.to}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {exportMutation.isPending ? (
                <>
                  <Download className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}