import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Calendar, BarChart3, Filter, Truck } from "lucide-react";
import { format, subDays, subMonths } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { MultiSelectVehicleFilter } from "../MultiSelectVehicleFilter";

interface ComplianceReport {
  report_generated_at: string;
  report_period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_vehicles: number;
    compliant_vehicles: number;
    overdue_vehicles: number;
    never_checked: number;
    compliance_rate: number;
  };
  vehicle_details: Array<{
    vehicle_id: string;
    license_plate: string;
    make?: string;
    model?: string;
    nickname?: string;
    last_check_date: string | null;
    has_kit: boolean;
    compliance_status: string;
    missing_items: any[];
  }>;
}

export const SpillKitComplianceReports: React.FC = () => {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reportPeriod, setReportPeriod] = useState("30days");
  const [selectedVehicles, setSelectedVehicles] = useState<any[]>([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  // Generate compliance report
  const { data: report, isLoading: reportLoading, refetch: generateReport, error: reportError } = useQuery({
    queryKey: ["spill-kit-compliance-report", startDate, endDate, selectedVehicles],
    queryFn: async () => {
      const vehicleIds = selectedVehicles.map(v => v.id);
      const { data, error } = await supabase
        .rpc("generate_spill_kit_compliance_report", {
          p_start_date: startDate,
          p_end_date: endDate,
          p_vehicle_ids: vehicleIds.length > 0 ? vehicleIds : null
        });
      
      if (error) {
        console.error('Report generation error:', error);
        toast({
          title: "Report Generation Failed",
          description: error.message || "Unable to generate compliance report. The database function may not be configured yet.",
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Report Generated",
        description: "Compliance report has been generated successfully.",
      });
      
      return data as any as ComplianceReport;
    },
    enabled: false // Don't auto-fetch, user must click generate
  });

  // Fetch vehicles for filter
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, license_plate")
        .eq("status", "active")
        .order("license_plate");
      
      if (error) throw error;
      return data;
    }
  });

  const handlePeriodChange = (period: string) => {
    setReportPeriod(period);
    const now = new Date();
    
    switch (period) {
      case "7days":
        setStartDate(format(subDays(now, 7), "yyyy-MM-dd"));
        break;
      case "30days":
        setStartDate(format(subDays(now, 30), "yyyy-MM-dd"));
        break;
      case "90days":
        setStartDate(format(subDays(now, 90), "yyyy-MM-dd"));
        break;
      case "6months":
        setStartDate(format(subMonths(now, 6), "yyyy-MM-dd"));
        break;
      case "1year":
        setStartDate(format(subMonths(now, 12), "yyyy-MM-dd"));
        break;
    }
    setEndDate(format(now, "yyyy-MM-dd"));
  };

  const exportToPDF = async () => {
    if (!report) {
      toast({
        title: "No Report Data",
        description: "Please generate a report first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create PDF export logic here
      const reportContent = {
        title: "Spill Kit Compliance Report",
        period: `${report.report_period.start_date} to ${report.report_period.end_date}`,
        summary: report.summary,
        vehicles: report.vehicle_details
      };

      // For now, we'll create a simple text export
      const textContent = `
SPILL KIT COMPLIANCE REPORT
Generated: ${new Date(report.report_generated_at).toLocaleString()}
Period: ${report.report_period.start_date} to ${report.report_period.end_date}

SUMMARY:
- Total Vehicles: ${report.summary.total_vehicles}
- Compliant Vehicles: ${report.summary.compliant_vehicles}
- Overdue Vehicles: ${report.summary.overdue_vehicles}
- Never Checked: ${report.summary.never_checked}
- Compliance Rate: ${report.summary.compliance_rate}%

VEHICLE DETAILS:
${report.vehicle_details.map(v => {
  const vehicleName = v.make && v.model 
    ? `${v.make} ${v.model}${v.nickname ? ` - ${v.nickname}` : ''}`
    : v.license_plate;
  return `
${vehicleName}
License Plate: ${v.license_plate}
Status: ${v.compliance_status}
Last Check: ${v.last_check_date || 'Never'}
Has Kit: ${v.has_kit ? 'Yes' : 'No'}
`;
}).join('\n')}
      `;

      const blob = new Blob([textContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spill-kit-compliance-report-${format(new Date(), "yyyy-MM-dd")}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Report Exported",
        description: "Compliance report has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export report.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "compliant": return "default";
      case "overdue": return "destructive";
      case "never_checked": return "secondary";
      case "non_compliant": return "destructive";
      default: return "outline";
    }
  };

  const getStatusBadgeText = (status: string) => {
    switch (status) {
      case "compliant": return "Compliant";
      case "overdue": return "Overdue";
      case "never_checked": return "Never Checked";
      case "non_compliant": return "Non-Compliant";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Vehicle Spill Kit Reports</h2>
          <p className="text-muted-foreground">Generate and export DOT/OSHA compliance reports</p>
        </div>
      </div>

      {/* Vehicle Multi-Select Modal */}
      <MultiSelectVehicleFilter
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
        selectedVehicles={selectedVehicles}
        onVehiclesChange={setSelectedVehicles}
      />

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-period">Quick Period</Label>
              <Select value={reportPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-filter">Vehicle Filter</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsVehicleModalOpen(true)}
              >
                <Truck className="mr-2 h-4 w-4" />
                {selectedVehicles.length > 0 
                  ? `${selectedVehicles.length} vehicle${selectedVehicles.length > 1 ? 's' : ''} selected`
                  : "All Vehicles"
                }
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={() => generateReport()} disabled={reportLoading}>
              <BarChart3 className="h-4 w-4 mr-2" />
              {reportLoading ? "Generating..." : "Generate Report"}
            </Button>
            {report && (
              <Button variant="outline" onClick={exportToPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {report && (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{report.summary.total_vehicles}</div>
                <p className="text-sm text-muted-foreground">Total Vehicles</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{report.summary.compliant_vehicles}</div>
                <p className="text-sm text-muted-foreground">Compliant</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{report.summary.overdue_vehicles}</div>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-600">{report.summary.never_checked}</div>
                <p className="text-sm text-muted-foreground">Never Checked</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{report.summary.compliance_rate}%</div>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Details Table */}
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold">Vehicle Details</h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Vehicle</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Last Check</th>
                      <th className="text-left p-2">Has Kit</th>
                      <th className="text-left p-2">Missing Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.vehicle_details.map((vehicle) => (
                      <tr key={vehicle.vehicle_id} className="border-b">
                        <td className="p-2 font-medium">
                          <div className="flex flex-col">
                            {vehicle.make && vehicle.model ? (
                              <>
                                <span>{vehicle.make} {vehicle.model}{vehicle.nickname ? ` - ${vehicle.nickname}` : ''}</span>
                                <span className="text-sm text-muted-foreground">{vehicle.license_plate}</span>
                              </>
                            ) : (
                              <span>{vehicle.license_plate}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant={getStatusBadgeVariant(vehicle.compliance_status)}>
                            {getStatusBadgeText(vehicle.compliance_status)}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {vehicle.last_check_date 
                            ? format(new Date(vehicle.last_check_date), "MM/dd/yyyy")
                            : "Never"
                          }
                        </td>
                        <td className="p-2">
                          <Badge variant={vehicle.has_kit ? "default" : "destructive"}>
                            {vehicle.has_kit ? "Yes" : "No"}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {vehicle.missing_items?.length > 0 
                            ? vehicle.missing_items.length + " items"
                            : "None"
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Report Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Report Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Generated At</div>
                  <div className="text-muted-foreground">
                    {new Date(report.report_generated_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Report Period</div>
                  <div className="text-muted-foreground">
                    {format(new Date(report.report_period.start_date), "MM/dd/yyyy")} - {format(new Date(report.report_period.end_date), "MM/dd/yyyy")}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Vehicles Included</div>
                  <div className="text-muted-foreground">
                    {selectedVehicles.length > 0 ? `${selectedVehicles.length} selected` : "All active vehicles"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};