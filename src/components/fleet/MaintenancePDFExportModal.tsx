import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileDown, Download, Calendar } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { addDays, format, subMonths, subYears } from "date-fns";

interface MaintenancePDFExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaintenancePDFExportModal({ open, onOpenChange }: MaintenancePDFExportModalProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date()
  });
  const [quickSelect, setQuickSelect] = useState<string>("last_30_days");
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includePhotos, setIncludePhotos] = useState(false);

  // Quick date range presets
  const handleQuickSelect = (value: string) => {
    setQuickSelect(value);
    const now = new Date();
    
    switch (value) {
      case "last_7_days":
        setDateRange({ from: addDays(now, -7), to: now });
        break;
      case "last_30_days":
        setDateRange({ from: addDays(now, -30), to: now });
        break;
      case "last_90_days":
        setDateRange({ from: addDays(now, -90), to: now });
        break;
      case "last_6_months":
        setDateRange({ from: subMonths(now, 6), to: now });
        break;
      case "last_year":
        setDateRange({ from: subYears(now, 1), to: now });
        break;
      case "all_time":
        setDateRange({ from: new Date("2020-01-01"), to: now });
        break;
      default:
        break;
    }
  };

  // Fetch maintenance records for export
  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!dateRange?.from || !dateRange?.to) {
        throw new Error("Please select a date range");
      }

      const { data: records, error } = await supabase
        .from("maintenance_records")
        .select(`
          *,
          vehicles(license_plate, vehicle_type, make, model, nickname),
          maintenance_task_types(name),
          maintenance_vendors(name)
        `)
        .gte("scheduled_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("scheduled_date", format(dateRange.to, "yyyy-MM-dd"))
        .order("scheduled_date", { ascending: false });

      if (error) {
        console.error("Error fetching maintenance records:", error);
        throw error;
      }

      console.log("Fetched records for PDF:", records);
      return records || [];
    },
    onSuccess: (records) => {
      generatePDFReport(records);
      toast.success("PDF report generated successfully");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Export failed: ${error.message}`);
    }
  });

  const generatePDFReport = (records: any[]) => {
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fleet Maintenance Report</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px;
            line-height: 1.4;
            color: #333;
          }
          
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }
          
          .header h1 {
            color: #2563eb;
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 600;
          }
          
          .header p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
          }
          
          .summary { 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 20px; 
            margin-bottom: 30px; 
            border-radius: 8px;
            border: 1px solid #cbd5e1;
          }
          
          .summary h2 {
            color: #1e40af;
            margin: 0 0 15px 0;
            font-size: 18px;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          
          .summary-item { 
            background: white;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          
          .summary-item .label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          
          .summary-item .value {
            font-size: 18px;
            font-weight: 600;
            color: #0f172a;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          th { 
            background: #2563eb;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          td { 
            padding: 10px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
          }
          
          tr:nth-child(even) {
            background: #f8fafc;
          }
          
          tr:hover {
            background: #f1f5f9;
          }
          
          .status {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .status.completed { background: #dcfce7; color: #166534; }
          .status.scheduled { background: #f3f4f6; color: #374151; }
          .status.in_progress { background: #dbeafe; color: #1d4ed8; }
          .status.cancelled { background: #fee2e2; color: #dc2626; }
          
          .priority {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: inline-block;
          }
          
          .priority.critical { background: #dc2626; color: white; }
          .priority.high { background: #ea580c; color: white; }
          .priority.medium { background: #ca8a04; color: white; }
          .priority.low { background: #16a34a; color: white; }
          .priority.normal { background: #6b7280; color: white; }
          
          .cost { text-align: right; font-weight: 600; }
          
          .vehicle-info {
            font-weight: 500;
            color: #1e40af;
          }
          
          .description {
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          @media print { 
            body { margin: 0; } 
            .summary { break-inside: avoid; }
            table { break-inside: avoid; }
            tr { break-inside: avoid; }
          }
          
          @page {
            margin: 0.75in;
            size: letter;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Fleet Maintenance Report</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p><strong>Report Period:</strong> ${dateRange?.from ? format(dateRange.from, "MMM d, yyyy") : "N/A"} - ${dateRange?.to ? format(dateRange.to, "MMM d, yyyy") : "N/A"}</p>
          <p><strong>Total Records:</strong> ${records.length}</p>
        </div>
        
        ${includeSummary ? `
        <div class="summary">
          <h2>Summary Statistics</h2>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="label">Total Records</div>
              <div class="value">${records.length}</div>
            </div>
            <div class="summary-item">
              <div class="label">Completed</div>
              <div class="value">${records.filter(r => r.status === 'completed').length}</div>
            </div>
            <div class="summary-item">
              <div class="label">Scheduled</div>
              <div class="value">${records.filter(r => r.status === 'scheduled').length}</div>
            </div>
            <div class="summary-item">
              <div class="label">Total Cost</div>
              <div class="value">$${records.reduce((sum, r) => {
                const cost = r.total_cost || (r.parts_cost || 0) + (r.labor_cost || 0);
                return sum + cost;
              }, 0).toLocaleString()}</div>
            </div>
            <div class="summary-item">
              <div class="label">Average Cost</div>
              <div class="value">$${records.length > 0 ? (records.reduce((sum, r) => {
                const cost = r.total_cost || (r.parts_cost || 0) + (r.labor_cost || 0);
                return sum + cost;
              }, 0) / records.length).toFixed(2) : '0.00'}</div>
            </div>
            <div class="summary-item">
              <div class="label">Unique Vehicles</div>
              <div class="value">${new Set(records.map(r => r.vehicle_id)).size}</div>
            </div>
          </div>
        </div>
        ` : ''}
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Vehicle</th>
              <th>Task Type</th>
              <th>Description</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Cost</th>
              <th>Technician</th>
              <th>Vendor</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(record => {
              const priority = record.priority || 'normal';
              const totalCost = record.total_cost || (record.parts_cost || 0) + (record.labor_cost || 0);
              const technicianName = record.technician_name || 
                (record.technician_id ? 'Assigned' : 'Unassigned');
              const vendorName = record.maintenance_vendors?.name || 
                record.vendor_name || 'In-House';
              
              return `
              <tr>
                <td>${format(new Date(record.scheduled_date), "MMM d, yyyy")}</td>
                <td class="vehicle-info">
                  ${record.vehicles?.license_plate || 'Unknown'}<br>
                  <small style="color: #64748b;">${record.vehicles?.make} ${record.vehicles?.model}</small>
                </td>
                <td>${record.maintenance_task_types?.name || record.maintenance_type || 'N/A'}</td>
                <td class="description" title="${record.description || ''}">${record.description || 'No description'}</td>
                <td><span class="status ${record.status}">${record.status}</span></td>
                <td><span class="priority ${priority}">${priority}</span></td>
                <td class="cost">$${totalCost.toFixed(2)}</td>
                <td>${technicianName}</td>
                <td>${vendorName}</td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
          <p>This report was generated automatically from the PortaPro Fleet Management System</p>
          <p>Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </body>
      </html>
    `;

    // Open in new window and trigger print
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(reportHTML);
      newWindow.document.close();
      
      // Wait for content to load, then trigger print
      newWindow.onload = () => {
        setTimeout(() => {
          newWindow.print();
        }, 500);
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-primary" />
            Export Maintenance Records as PDF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Date Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Time Period</Label>
            <Select value={quickSelect} onValueChange={handleQuickSelect}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
                <SelectItem value="all_time">All Time</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {quickSelect === "custom" && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Custom Date Range</Label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
                className="w-full"
              />
            </div>
          )}

          {/* Export Options */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Report Options</Label>
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
                  id="include-charts"
                  checked={includeCharts}
                  onCheckedChange={(checked) => setIncludeCharts(checked === true)}
                />
                <Label htmlFor="include-charts">Include visual charts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-photos"
                  checked={includePhotos}
                  onCheckedChange={(checked) => setIncludePhotos(checked === true)}
                />
                <Label htmlFor="include-photos">Include service photos</Label>
              </div>
            </div>
          </div>

          {/* Date Range Preview */}
          {dateRange?.from && dateRange?.to && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-sm text-black">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Report will include records from:</span>
              </div>
              <p className="text-sm text-black mt-1">
                {format(dateRange.from, "MMMM d, yyyy")} to {format(dateRange.to, "MMMM d, yyyy")}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending || !dateRange?.from || !dateRange?.to}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              {exportMutation.isPending ? (
                <>
                  <Download className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate PDF Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}