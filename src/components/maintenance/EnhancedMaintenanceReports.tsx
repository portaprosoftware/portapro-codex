import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Eye, Download, Camera } from "lucide-react";

interface EnhancedMaintenanceReportsProps {
  vehicleId?: string;
}

export const EnhancedMaintenanceReports: React.FC<EnhancedMaintenanceReportsProps> = ({
  vehicleId
}) => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Fetch maintenance reports
  const { data: reports } = useQuery({
    queryKey: ["maintenance-reports", vehicleId],
    queryFn: async () => {
      let query = supabase
        .from("maintenance_reports")
        .select("*");

      // Note: maintenance_reports table structure needs to be verified
      // For now, we'll work with the actual fields available

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch detailed report data
  const { data: reportDetail } = useQuery({
    queryKey: ["maintenance-report-detail", selectedReport],
    queryFn: async () => {
      if (!selectedReport) return null;

      const { data, error } = await supabase
        .from("maintenance_reports")
        .select("*")
        .eq("id", selectedReport)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedReport
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-700",
      in_progress: "bg-blue-100 text-blue-700", 
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700"
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.draft}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Maintenance Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports?.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.id.slice(0, 8) || "N/A"}</TableCell>
                  <TableCell>
                    {new Date(report.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {report.customer_id ? `Report for customer ${report.customer_id.slice(0, 8)}` : "No description"}
                  </TableCell>
                  <TableCell>{getStatusBadge(report.workflow_status || "draft")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReport(report.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Maintenance Report: {reportDetail?.report_number || "N/A"}
            </DialogTitle>
          </DialogHeader>

          {reportDetail && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Date</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(reportDetail.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Status</h3>
                  <div className="text-sm text-gray-600">
                    {getStatusBadge(reportDetail.workflow_status || "draft")}
                  </div>
                </div>
              </div>

              {/* Report Content */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Report Details</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Report ID: {reportDetail.id}
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    Created: {new Date(reportDetail.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Future: Tool Tracking Integration */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Tool Tracking (Coming Soon)
                </h3>
                <p className="text-sm text-blue-700">
                  Tool number and vendor ID tracking will be integrated here once the database relationships are established.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};