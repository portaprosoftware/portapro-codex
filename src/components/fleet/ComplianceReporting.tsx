
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertTriangle, CheckCircle, FileText, CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ComplianceReport {
  report_date: string;
  summary: {
    total_vehicles: number;
    vehicles_in_violation: number;
    avg_compliance_score: number;
    total_capacity_violations: number;
  };
  vehicle_violations: Array<{
    vehicle_id: string;
    license_plate: string;
    capacity_violations: number;
    compliance_score: number;
  }>;
}

export const ComplianceReporting: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [hasLoaded, setHasLoaded] = useState(false);

  const { data: complianceReport, isFetching, refetch, error } = useQuery({
    queryKey: ['compliance-report', selectedDate],
    queryFn: async (): Promise<ComplianceReport> => {
      const { data, error } = await supabase.rpc('generate_daily_compliance_report', {
        target_date: format(selectedDate, 'yyyy-MM-dd')
      });
      if (error) throw error;
      return data as unknown as ComplianceReport;
    },
    enabled: false, // fetch on demand to prevent initial blink
    placeholderData: (prev) => prev, // keep previous to avoid UI flicker
  });

  const handleGenerate = async () => {
    setHasLoaded(true);
    await refetch();
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getComplianceBadge = (score: number) => {
    if (score >= 90) return { variant: "default" as const, text: "Excellent" };
    if (score >= 70) return { variant: "secondary" as const, text: "Good" };
    return { variant: "destructive" as const, text: "Needs Attention" };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Compliance Reporting</h1>
          <p className="text-muted-foreground">Monitor fleet compliance and violations</p>
        </div>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus />
            </PopoverContent>
          </Popover>
          
          <Button onClick={handleGenerate} disabled={isFetching}>
            <FileText className="h-4 w-4 mr-2" />
            {isFetching ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </div>

      {!hasLoaded && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Select a date and click “Generate Report” to view compliance details.
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-red-600">There was a problem generating the report. Please try another date.</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {complianceReport && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Vehicles</p>
                    <p className="text-2xl font-bold">{complianceReport.summary.total_vehicles}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Violations</p>
                    <p className="text-2xl font-bold text-red-600">{complianceReport.summary.vehicles_in_violation}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Compliance</p>
                    <p className={cn("text-2xl font-bold", getComplianceColor(complianceReport.summary.avg_compliance_score))}>
                      {complianceReport.summary.avg_compliance_score.toFixed(1)}%
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Capacity Issues</p>
                    <p className="text-2xl font-bold">{complianceReport.summary.total_capacity_violations}</p>
                  </div>
                  <Download className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Details */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Compliance Details</CardTitle>
            </CardHeader>
            <CardContent>
              {complianceReport.vehicle_violations.length > 0 ? (
                <div className="space-y-4">
                  {complianceReport.vehicle_violations.map((vehicle) => {
                    const badge = getComplianceBadge(vehicle.compliance_score);
                    return (
                      <div key={vehicle.vehicle_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{vehicle.license_plate}</p>
                            <p className="text-sm text-muted-foreground">
                              {vehicle.capacity_violations} capacity violations
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Compliance Score</p>
                            <p className={cn("text-lg font-semibold", getComplianceColor(vehicle.compliance_score))}>
                              {vehicle.compliance_score.toFixed(1)}%
                            </p>
                          </div>
                          
                          <Badge variant={badge.variant}>
                            {badge.text}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No compliance data available for the selected date</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
