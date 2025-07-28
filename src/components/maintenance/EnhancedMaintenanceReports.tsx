import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Eye, Download, Camera, Shield, Target } from "lucide-react";

interface EnhancedMaintenanceReportsProps {
  vehicleId?: string;
}

export const EnhancedMaintenanceReports: React.FC<EnhancedMaintenanceReportsProps> = ({
  vehicleId
}) => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Fetch maintenance reports (simplified for now)
  const { data: reports } = useQuery({
    queryKey: ["maintenance-reports", vehicleId],
    queryFn: async () => {
      let query = supabase
        .from("maintenance_reports")
        .select("*");

      if (vehicleId) {
        query = query.eq("vehicle_id", vehicleId);
      }

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
        .select(`
          *,
          vehicles (license_plate, vehicle_type),
          maintenance_report_attachments (*),
          product_items (tool_number, vendor_id, plastic_code, verification_status, ocr_confidence_score)
        `)
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

  const getVerificationBadge = (status: string | null) => {
    if (!status) return null;
    
    const badges = {
      manual_verified: <Badge className="bg-green-100 text-green-700"><Shield className="w-3 h-3 mr-1" />Verified</Badge>,
      auto_detected: <Badge className="bg-blue-100 text-blue-700">Auto-detected</Badge>,
      needs_review: <Badge className="bg-red-100 text-red-700">Needs Review</Badge>
    };

    return badges[status as keyof typeof badges] || null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Maintenance Reports with Tool Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report #</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Tool Tracking</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports?.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.report_number}</TableCell>
                  <TableCell>
                    Vehicle #{report.vehicle_id}
                  </TableCell>
                  <TableCell>
                    {new Date(report.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-gray-500">Tool tracking coming soon</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
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
              Maintenance Report: {reportDetail?.report_number}
            </DialogTitle>
          </DialogHeader>

          {reportDetail && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Vehicle Information</h3>
                  <p className="text-sm text-gray-600">
                    {reportDetail.vehicles?.license_plate} - {reportDetail.vehicles?.vehicle_type}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Service Date</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(reportDetail.service_date || reportDetail.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Tool Tracking Information */}
              {reportDetail.product_items?.tool_number && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Tool Tracking Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium text-blue-700">Tool Number:</span>
                      <p className="text-blue-600 font-mono">{reportDetail.product_items.tool_number}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-700">Vendor ID:</span>
                      <p className="text-blue-600 font-mono">{reportDetail.product_items.vendor_id || "—"}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-700">Plastic Code:</span>
                      <p className="text-blue-600">{reportDetail.product_items.plastic_code || "—"}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-700">Verification:</span>
                      <div className="mt-1">
                        {getVerificationBadge(reportDetail.product_items.verification_status)}
                      </div>
                    </div>
                    {reportDetail.product_items.ocr_confidence_score && (
                      <div>
                        <span className="text-sm font-medium text-blue-700">OCR Confidence:</span>
                        <p className="text-blue-600">
                          {Math.round(reportDetail.product_items.ocr_confidence_score * 100)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Report Content */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Report Details</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    {reportDetail.report_data?.description || "No detailed description available."}
                  </p>
                </div>
              </div>

              {/* Attachments */}
              {reportDetail.maintenance_report_attachments?.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Attachments</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {reportDetail.maintenance_report_attachments.map((attachment: any) => (
                      <div key={attachment.id} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm font-medium truncate">
                            {attachment.file_name}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {attachment.attachment_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};