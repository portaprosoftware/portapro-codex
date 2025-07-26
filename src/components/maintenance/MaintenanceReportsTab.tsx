
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/ui/StatCard";
import { ReportDetailsPanel } from "./ReportDetailsPanel";
import { BulkActionsModal } from "./BulkActionsModal";
import { AdvancedAnalyticsWidget } from "./AdvancedAnalyticsWidget";
import { CustomDateRangeModal } from "./CustomDateRangeModal";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Search, FileText, Clock, CheckCircle, AlertTriangle, Grid, List, Download, ChevronDown, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface MaintenanceReport {
  id: string;
  report_number: string;
  created_at: string;
  report_data: any;
  status: string;
  completion_percentage: number;
  assigned_technician: string;
  actual_completion: string;
}

export const MaintenanceReportsTab: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ["maintenance-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_reports")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
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

  const getReportCounts = () => {
    if (!reports) return { total: 0, open: 0, inProgress: 0, completed: 0 };
    
    return {
      total: reports.length,
      open: reports.filter(r => r.status === "open" || r.status === "scheduled").length,
      inProgress: reports.filter(r => r.status === "in_progress").length,
      completed: reports.filter(r => r.status === "completed").length,
    };
  };

  const counts = getReportCounts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Service Records</h2>
          <p className="text-gray-600">View and manage all service activity reports</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedRecords.length > 0 && (
            <Button
              onClick={() => setShowBulkActions(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Bulk Actions ({selectedRecords.length})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="border-purple-500 text-purple-600 hover:bg-purple-50"
          >
            {showAnalytics ? 'Hide' : 'Show'} Analytics
          </Button>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="px-3"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="px-3"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Analytics */}
      {showAnalytics && (
        <div className="bg-white border rounded-lg p-6">
          <AdvancedAnalyticsWidget />
        </div>
      )}

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Date Range:</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Last 7 Days</Button>
              <Button variant="outline" size="sm">This Month</Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCustomDateRange(true)}
              >
                Custom
                {dateRange && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {format(dateRange.start, "MMM d")} - {format(dateRange.end, "MMM d")}
                  </span>
                )}
              </Button>
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by report #, customer, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Records"
          value={counts.total}
          icon={FileText}
          gradientFrom="#3366FF"
          gradientTo="#6699FF"
          iconBg="#3366FF"
          subtitleColor="text-blue-600"
        />
        
        <StatCard
          title="Open"
          value={counts.open}
          icon={AlertTriangle}
          gradientFrom="#FF9933"
          gradientTo="#FFB366"
          iconBg="#FF9933"
          subtitleColor="text-orange-600"
        />
        
        <StatCard
          title="In Progress"
          value={counts.inProgress}
          icon={Clock}
          gradientFrom="#8B5CF6"
          gradientTo="#A78BFA"
          iconBg="#8B5CF6"
          subtitleColor="text-purple-600"
        />
        
        <StatCard
          title="Completed"
          value={counts.completed}
          icon={CheckCircle}
          gradientFrom="#33CC66"
          gradientTo="#66D999"
          iconBg="#33CC66"
          subtitleColor="text-green-600"
        />
      </div>

      {/* Records Display */}
      {viewMode === "table" ? (
        <Card className="rounded-2xl shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                    <Checkbox
                      checked={selectedRecords.length === (reports?.length || 0) && reports?.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRecords(reports?.map(r => r.id) || []);
                        } else {
                          setSelectedRecords([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Service Record #</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Customer/Location</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Service Type</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Progress</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports?.map((report, index) => {
                  const reportData = report.report_data as Record<string, any> || {};
                  return (
                    <tr 
                      key={report.id} 
                      className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'} ${
                        selectedRecords.includes(report.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={selectedRecords.includes(report.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRecords(prev => [...prev, report.id]);
                            } else {
                              setSelectedRecords(prev => prev.filter(id => id !== report.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {report.report_number || `SVC-${report.id.slice(0, 8)}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {reportData.customer_name || reportData.location || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {reportData.service_type || 'General Service'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`capitalize ${getStatusColor(report.status)}`}>
                          {report.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                            <div 
                              className="h-full bg-blue-600 rounded-full" 
                              style={{ width: `${report.completion_percentage || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{report.completion_percentage || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReport(report.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase.functions.invoke('generate-service-pdf', {
                                  body: { reportId: report.id }
                                });
                                if (error) throw error;
                                
                                const blob = new Blob([data], { type: 'application/pdf' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `service-report-${report.report_number || report.id}.pdf`;
                                a.click();
                                window.URL.revokeObjectURL(url);
                                toast.success("PDF downloaded successfully");
                              } catch (error) {
                                toast.error("Failed to generate PDF");
                                console.error(error);
                              }
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports?.map((report) => {
            const reportData = report.report_data as Record<string, any> || {};
            return (
              <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {report.report_number || `SVC-${report.id.slice(0, 8)}`}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={`capitalize ${getStatusColor(report.status)}`}>
                    {report.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Customer:</span> {reportData.customer_name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Service:</span> {reportData.service_type || 'General Service'}
                  </p>
                </div>

                <div className="flex items-center mb-4">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full mr-2">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${report.completion_percentage || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">{report.completion_percentage || 0}%</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedReport(report.id)}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.functions.invoke('generate-service-pdf', {
                          body: { reportId: report.id }
                        });
                        if (error) throw error;
                        
                        const blob = new Blob([data], { type: 'application/pdf' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `service-report-${report.report_number || report.id}.pdf`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                        toast.success("PDF downloaded successfully");
                      } catch (error) {
                        toast.error("Failed to generate PDF");
                        console.error(error);
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Report Details Panel */}
      <ReportDetailsPanel
        reportId={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
      />

      {/* Bulk Actions Modal */}
      <BulkActionsModal
        isOpen={showBulkActions}
        onClose={() => setShowBulkActions(false)}
        selectedRecords={selectedRecords}
        onSuccess={() => {
          setSelectedRecords([]);
          setShowBulkActions(false);
        }}
      />

      {/* Custom Date Range Modal */}
      <CustomDateRangeModal
        isOpen={showCustomDateRange}
        onClose={() => setShowCustomDateRange(false)}
        onApply={(start, end) => {
          setDateRange({ start, end });
          toast.success(`Date filter applied: ${format(start, "MMM d")} - ${format(end, "MMM d")}`);
        }}
      />
    </div>
  );
};
