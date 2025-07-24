
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Printer, CheckCircle, Save, Camera, PenTool } from "lucide-react";

interface ReportDetailsPanelProps {
  reportId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportDetailsPanel: React.FC<ReportDetailsPanelProps> = ({
  reportId,
  isOpen,
  onClose,
}) => {
  const { data: report, isLoading } = useQuery({
    queryKey: ["maintenance-report", reportId],
    queryFn: async () => {
      if (!reportId) return null;
      
      const { data, error } = await supabase
        .from("maintenance_reports")
        .select("*")
        .eq("id", reportId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!reportId,
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
      case "scheduled":
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0";
      case "in_progress":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0";
      case "completed":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
      case "overdue":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0";
      case "draft":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
    }
  };

  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[70%] max-w-4xl">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-bold">
            Report #{report?.report_number || reportId?.slice(0, 8)}
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section A: Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Report Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="text-gray-900">
                    {report?.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Technician</label>
                  <p className="text-gray-900">{report?.assigned_technician || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Vehicle/Unit</label>
                  <p className="text-gray-900">
                    {(report?.report_data as any)?.vehicle_info || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Service Type</label>
                  <p className="text-gray-900">{(report?.report_data as any)?.service_type || 'General Maintenance'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge className={`capitalize mt-1 ${getStatusColor(report?.status)}`}>
                    {report?.status?.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Completion</label>
                  <div className="flex items-center mt-1">
                    <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                      <div 
                        className="h-full bg-blue-600 rounded-full" 
                        style={{ width: `${report?.completion_percentage || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{report?.completion_percentage || 0}%</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-gray-900 mt-1">
                    {report?.actual_completion || 'No notes provided'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Section B: Signature & Photos */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Signature & Photos</h3>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Customer Signature</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {(report?.report_data as any)?.customer_signature ? (
                      <div className="flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <span className="ml-2 text-green-600">Signature Captured</span>
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <PenTool className="w-8 h-8 mx-auto mb-2" />
                        <p>No signature captured</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Tech Signature</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {(report?.report_data as any)?.tech_signature ? (
                      <div className="flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <span className="ml-2 text-green-600">Signature Captured</span>
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <PenTool className="w-8 h-8 mx-auto mb-2" />
                        <p>No signature captured</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Service Photos</label>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {/* Placeholder for photos */}
                  <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Add Photo
                  </Button>
                  <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                    <PenTool className="w-4 h-4" />
                    Capture Signature
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4" />
            Mark Complete
          </Button>
          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
